import { SEO, SEO_TYPES, type BreadcrumbInput, type SeoType } from "./seo.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  cache,
  exactCi,
  identifierFilter,
  isPermanent,
  logger,
  pagedResult,
  parseList,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  type Filter,
} from "../../utils";
import { SEO_SEED, SEO_SEED_IMAGE } from "./seo.seed";
import { uploadBase64ToGitHub } from "../../integrations/github";
import { CREATOR_POPULATE, getRoleBasedCreatorFilter, resolveUserObjectId } from "../roles/role.helpers";
import type { SeoBody, SeoListQuery } from "./seo.types";

const CREATOR = "id fullname email mobile image role";

const toSeoType = (value: unknown): SeoType => {
  const type = str(value).toLowerCase();
  if (!(SEO_TYPES as readonly string[]).includes(type)) {
    throw AppError.badRequest(`type must be one of: ${SEO_TYPES.join(", ")}`);
  }
  return type as SeoType;
};

const parseBreadcrumbs = (value: unknown): BreadcrumbInput[] =>
  parseList<BreadcrumbInput>(value).filter((b) => b && typeof b === "object" && b.label && b.path);

const findSeo = async (identifier: string) => {
  const seo = await SEO.findOne(
    identifierFilter(identifier, (v) => [{ name: exactCi(v) }, { path: v }, { page: exactCi(v) }])
  );
  if (!seo) throw AppError.notFound("SEO configuration not found");
  return seo;
};

/* ================= SEED (only when empty unless force=true) ================= */
export const seedInitialSeo = async (force = false, createdBy?: string) => {
  const count = await SEO.countDocuments();
  if (count > 0 && !force) {
    return { message: `SEO collection already has ${count} records. Pass force=true to re-seed.`, count };
  }

  const resolvedCreatedBy = createdBy ? (await resolveUserObjectId(createdBy)) || createdBy : null;

  for (const item of SEO_SEED) {
    await SEO.findOneAndUpdate(
      { $or: [{ id: item.id }, { name: item.name }] },
      {
        ...item,
        page: item.name,
        image: SEO_SEED_IMAGE,
        noindex: false,
        isActive: true,
        isDeleted: false,
        createdBy: resolvedCreatedBy,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
  }

  cache.invalidate("seo");
  cache.invalidate("seo_status_counts");
  logger.info(`SEO_INITIAL_SEEDED: ${SEO_SEED.length} pages populated`);
  return { message: `Successfully seeded ${SEO_SEED.length} SEO records`, count: SEO_SEED.length };
};

/* ================= CREATE (restores a soft-deleted config with the same name/path) ================= */
export const createSeo = async (data: SeoBody, createdBy: string) => {
  const name = str(data.name).toLowerCase();
  const path = str(data.path);
  if (!name) throw AppError.badRequest("Page name is required");
  if (!path) throw AppError.badRequest("URL path is required");

  const resolvedCreatedBy = (await resolveUserObjectId(createdBy)) || createdBy;

  const existing = await SEO.findOne({ $or: [{ name }, { path }] });
  if (existing) {
    if (!existing.isDeleted) throw AppError.conflict(`SEO config for "${name}" or path "${path}" already exists`);
    existing.isDeleted = false;
    existing.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
    if (data.title !== undefined) existing.title = str(data.title);
    if (data.description !== undefined) existing.description = str(data.description);
    if (data.keywords !== undefined) existing.keywords = str(data.keywords);
    if (data.image !== undefined) existing.image = await uploadBase64ToGitHub(str(data.image), `seo-${name}`);
    if (data.type !== undefined) existing.type = toSeoType(data.type);
    if (data.noindex !== undefined) existing.noindex = toBool(data.noindex);
    if (data.breadcrumbs !== undefined) existing.set("breadcrumbs", parseBreadcrumbs(data.breadcrumbs));
    if (resolvedCreatedBy && !existing.createdBy) existing.createdBy = resolvedCreatedBy as any;
    await existing.save();
    cache.invalidate("seo");
    cache.invalidate("seo_status_counts");
    logger.info(`SEO_RESTORED_AND_UPDATED: ${existing.name} (${existing.id})`);
    return existing;
  }

  const id = str(data.id);
  if (id && (await SEO.exists({ id }))) throw AppError.conflict(`SEO config with ID ${id} already exists`);

  const seo = await SEO.create({
    ...(id ? { id } : {}),
    name,
    page: str(data.page) || name,
    path,
    title: str(data.title),
    description: str(data.description),
    keywords: str(data.keywords),
    image: data.image ? await uploadBase64ToGitHub(str(data.image), `seo-${name}`) : SEO_SEED_IMAGE,
    type: data.type ? toSeoType(data.type) : "website",
    noindex: toBool(data.noindex),
    breadcrumbs: parseBreadcrumbs(data.breadcrumbs),
    isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
    createdBy: resolvedCreatedBy,
  });
  cache.invalidate("seo");
  cache.invalidate("seo_status_counts");
  logger.info(`SEO_CREATED: ${seo.name} (${seo.id})`);
  return seo;
};

/* ================= LIST ================= */
export const getSeoList = async (query: SeoListQuery = {}) => {
  return cache.wrap(
    "seo",
    query as Record<string, unknown>,
    async () => {
      const filter: Filter = {
        ...baseListFilter(query),
        ...searchFilter(query.search, ["id", "name", "page", "path", "title", "description", "keywords"]),
      };
      if (query.type) filter.type = str(query.type).toLowerCase();

      const creatorFilter = await getRoleBasedCreatorFilter(query.userId || query.createdBy);
      if (Object.keys(creatorFilter).length) {
        Object.assign(filter, creatorFilter);
      }

      const paging = readPagination(query, 20, true);

      const [seos, total, active, inactive, trash] = await Promise.all([
        SEO.find(filter)
          .populate("createdBy", CREATOR_POPULATE)
          .sort({ createdAt: 1 })
          .skip(paging.skip)
          .limit(paging.limit)
          .lean(),
        SEO.countDocuments(filter),
        SEO.countDocuments({ ...filter, isDeleted: false, isActive: true }),
        SEO.countDocuments({ ...filter, isDeleted: false, isActive: false }),
        SEO.countDocuments({ ...filter, isDeleted: true }),
      ]);

      const result: any = pagedResult("seos", seos, total, paging);
      result.counts = { all: active + inactive, active, inactive, trash };
      return result;
    },
    60
  );
};

/* ================= GET ONE ================= */
export const getSeoById = async (identifier: string) => (await findSeo(identifier)).populate("createdBy", CREATOR);

export const getSeoByPage = async (pageName: string) => {
  const clean = str(pageName);
  if (!clean) throw AppError.badRequest("Page identifier is required");
  const seo = await SEO.findOne({
    $or: [{ name: exactCi(clean) }, { page: exactCi(clean) }, { id: clean }],
    isDeleted: false,
  }).populate("createdBy", CREATOR);
  if (!seo) throw AppError.notFound(`SEO configuration for page "${clean}" not found`);
  return seo;
};

export const getSeoByPath = async (urlPath: unknown) => {
  const clean = str(urlPath);
  if (!clean) throw AppError.badRequest("URL path is required");
  const seo = await SEO.findOne({ path: clean, isDeleted: false }).populate("createdBy", CREATOR);
  if (!seo) throw AppError.notFound(`SEO configuration for path "${clean}" not found`);
  return seo;
};

/* ================= UPDATE ================= */
export const updateSeo = async (identifier: string, data: SeoBody) => {
  const seo = await findSeo(identifier);

  const name = str(data.name).toLowerCase();
  if (name) {
    if (await SEO.exists({ name, _id: { $ne: seo._id }, isDeleted: false })) {
      throw AppError.conflict(`SEO configuration with name "${name}" already exists`);
    }
    seo.name = name;
  }

  if (data.page !== undefined) seo.page = str(data.page);
  if (data.path !== undefined) seo.path = str(data.path);
  if (data.title !== undefined) seo.title = str(data.title);
  if (data.description !== undefined) seo.description = str(data.description);
  if (data.keywords !== undefined) seo.keywords = str(data.keywords);
  if (data.image !== undefined) seo.image = await uploadBase64ToGitHub(str(data.image), `seo-${seo.name}`);
  if (data.type !== undefined) seo.type = toSeoType(data.type);
  if (data.noindex !== undefined) seo.noindex = toBool(data.noindex);
  if (data.breadcrumbs !== undefined) seo.set("breadcrumbs", parseBreadcrumbs(data.breadcrumbs));
  if (data.isActive !== undefined) seo.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) seo.isDeleted = toBool(data.isDeleted);
  if (data.createdBy && !seo.createdBy) {
    const resolvedUser = await resolveUserObjectId(data.createdBy);
    if (resolvedUser) seo.createdBy = resolvedUser as any;
  }

  await seo.save();
  cache.invalidate("seo");
  cache.invalidate("seo_status_counts");
  logger.info(`SEO_UPDATED: ${seo.name} (${seo.id})`);
  return seo;
};

/* ================= DELETE (?permanent=true for hard delete) ================= */
export const deleteSeo = async (identifier: string, permanent: boolean) => {
  const seo = await findSeo(identifier);

  cache.invalidate("seo");
  cache.invalidate("seo_status_counts");
  if (permanent || seo.isDeleted) {
    await SEO.deleteOne({ _id: seo._id });
    logger.info(`SEO_PERMANENTLY_DELETED: ${seo.name} (${seo.id})`);
    return { message: "SEO configuration permanently deleted", id: seo.id };
  }

  seo.isDeleted = true;
  await seo.save();
  logger.info(`SEO_SOFT_DELETED: ${seo.name} (${seo.id})`);
  return { message: "SEO configuration soft deleted", id: seo.id };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteSeo = async (body: unknown) => {
  const filter = bulkFilter(readBulkIds(body, "seoIds"), ["name"]);
  cache.invalidate("seo");
  cache.invalidate("seo_status_counts");

  if (isPermanent(body)) {
    const result = await SEO.deleteMany(filter);
    return { message: `${result.deletedCount} SEO configurations permanently deleted`, deletedCount: result.deletedCount };
  }

  const result = await SEO.updateMany(filter, { $set: { isDeleted: true } });
  return { message: `${result.modifiedCount} SEO configurations soft deleted`, modifiedCount: result.modifiedCount };
};
