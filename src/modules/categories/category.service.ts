import mongoose from "mongoose";
import { Product } from "../products/product.model";
import { ProductCategory } from "./category.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  cache,
  exactCi,
  identifierFilter,
  isPermanent,
  logger,
  nextSequentialId,
  pagedResult,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  toNumber,
  type Filter,
} from "../../utils";
import { CREATOR_POPULATE, getCreatorOrAdminFilter, resolveUserObjectId } from "../roles/role.helpers";
import { uploadBase64ToGitHub } from "../../integrations/github";
import type { CategoryBody, CategoryListQuery } from "./category.types";

const categoryName = (data: CategoryBody) => str(data.categoryName || data.name);

const findCategory = async (identifier: string) => {
  const category = await ProductCategory.findOne(identifierFilter(identifier, (v) => [{ categoryName: exactCi(v) }]));
  if (!category) throw AppError.notFound("Category not found");
  return category;
};

/* ================= CREATE (updates/restores if already exists) ================= */
export const createCategory = async (data: CategoryBody, createdBy: string) => {
  const name = categoryName(data);
  if (!name) throw AppError.badRequest("Category name is required");

  const storedImage = data.image !== undefined ? await uploadBase64ToGitHub(data.image, name) : undefined;
  const resolvedCreatedBy = (await resolveUserObjectId(createdBy || (data as any).createdBy || (data as any).userId)) || createdBy;
  const creatorScope = resolvedCreatedBy ? { createdBy: resolvedCreatedBy as any } : {};

  const existing = await ProductCategory.findOne({
    $or: [
      { categoryName: exactCi(name) },
      ...(data.id ? [{ id: str(data.id) }] : []),
    ],
    ...creatorScope,
  });

  if (existing) {
    existing.isDeleted = false;
    existing.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
    if (data.description !== undefined) existing.description = str(data.description);
    if (storedImage !== undefined) existing.image = storedImage;
    if (data.iconName !== undefined) existing.iconName = str(data.iconName);
    if (data.count !== undefined) existing.count = toNumber(data.count);
    if (createdBy) existing.createdBy = createdBy as any;
    await existing.save();
    cache.invalidate("categories");
    cache.invalidate("categories_counts");
    cache.invalidate("categories_status_counts");
    logger.info(`CATEGORY_UPDATED: ${existing.categoryName} (${existing.id})`);
    try {
      await existing.populate("createdBy", CREATOR_POPULATE);
    } catch {}
    return existing;
  }

  const id = str(data.id);
  const slug = (str(data.slug) || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const rawVendorBy = data.vendorBy || (data as any).VendorBy;
  const vendorById = rawVendorBy ? await resolveUserObjectId(rawVendorBy) : null;

  try {
    const category = await ProductCategory.create({
      ...(id ? { id } : {}),
      categoryName: name,
      slug,
      description: str(data.description),
      image: storedImage ?? "",
      iconName: str(data.iconName),
      count: toNumber(data.count),
      isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
      createdBy,
      vendorBy: vendorById ? new mongoose.Types.ObjectId(vendorById) : null,
    });
    cache.invalidate("categories");
    cache.invalidate("categories_counts");
    cache.invalidate("categories_status_counts");
    logger.info(`CATEGORY_CREATED: ${category.categoryName} (${category.id})`);
    try {
      await category.populate("createdBy", CREATOR_POPULATE);
      await category.populate("vendorBy", CREATOR_POPULATE);
    } catch {}
    return category;
  } catch (err: any) {
    if (err?.code === 11000) {
      const conflict = await ProductCategory.findOne({
        $or: [{ categoryName: exactCi(name) }, ...(id ? [{ id }] : [])],
        ...creatorScope,
      });
      if (conflict) {
        conflict.isDeleted = false;
        conflict.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
        if (data.description !== undefined) conflict.description = str(data.description);
        if (storedImage !== undefined) conflict.image = storedImage;
        if (data.iconName !== undefined) conflict.iconName = str(data.iconName);
        if (data.count !== undefined) conflict.count = toNumber(data.count);
        await conflict.save();
        try {
          await conflict.populate("createdBy", CREATOR_POPULATE);
        } catch {}
        return conflict;
      }
      const retryId = await nextSequentialId("categories", "PCAT");
      const retry = await ProductCategory.create({
        id: retryId,
        categoryName: name,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        description: str(data.description),
        image: storedImage ?? "",
        iconName: str(data.iconName),
        count: toNumber(data.count),
        isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
        createdBy,
      });
      try {
        await retry.populate("createdBy", CREATOR_POPULATE);
      } catch {}
      return retry;
    }
    throw err;
  }
};

/* ================= LIST ================= */
export const getCategories = async (query: CategoryListQuery = {}) => {
  return cache.wrap(
    "categories",
    query as Record<string, unknown>,
    async () => {
      const filter: Filter = { ...baseListFilter(query), ...searchFilter(query.search, ["id", "categoryName", "description"]) };
      const creatorScope = await getCreatorOrAdminFilter(query.userId || query.createdBy);
      if (creatorScope) {
        if (filter.$or) {
          const searchOr = filter.$or;
          delete filter.$or;
          filter.$and = [{ $or: searchOr }, creatorScope];
        } else {
          Object.assign(filter, creatorScope);
        }
      }

      const paging = readPagination(query, 10, true);

      const activeFilter: Filter = { isDeleted: false, isActive: true, ...(creatorScope ? creatorScope : {}) };
      const inactiveFilter: Filter = { isDeleted: false, isActive: false, ...(creatorScope ? creatorScope : {}) };
      const trashFilter: Filter = { isDeleted: true, ...(creatorScope ? creatorScope : {}) };

      const [categories, total, active, inactive, trash] = await Promise.all([
        ProductCategory.find(filter)
          .select("id categoryName slug description image iconName count isActive isDeleted createdBy vendorBy createdAt updatedAt")
          .populate("createdBy", CREATOR_POPULATE)
          .populate("vendorBy", CREATOR_POPULATE)
          .sort({ createdAt: -1 })
          .skip(paging.skip)
          .limit(paging.limit)
          .lean(),
        ProductCategory.countDocuments(filter),
        ProductCategory.countDocuments(activeFilter),
        ProductCategory.countDocuments(inactiveFilter),
        ProductCategory.countDocuments(trashFilter),
      ]);

      const result: any = pagedResult("categories", categories, total, paging);
      result.counts = { all: active + inactive, active, inactive, trash };
      return result;
    },
    60
  );
};

/* ================= GET ONE (Mongo _id, PCAT-001 or name) ================= */
export const getCategoryById = async (identifier: string) => {
  const category = await findCategory(identifier);
  await category.populate("createdBy", CREATOR_POPULATE);
  await category.populate("vendorBy", CREATOR_POPULATE);
  const count = await Product.countDocuments({ categoryId: category._id, isDeleted: false });
  return { ...category.toObject(), count };
};

/* ================= UPDATE ================= */
export const updateCategory = async (identifier: string, data: CategoryBody) => {
  const category = await findCategory(identifier);

  const rawVendorBy = data.vendorBy !== undefined ? data.vendorBy : (data as any).VendorBy;
  if (rawVendorBy !== undefined) {
    const vendorById = rawVendorBy ? await resolveUserObjectId(rawVendorBy) : null;
    category.set("vendorBy", vendorById ? new mongoose.Types.ObjectId(vendorById) : null);
  }

  const name = categoryName(data);
  if (name) {
    category.categoryName = name;
  }

  const newId = str(data.id);
  if (newId && newId !== category.id) {
    if (await ProductCategory.exists({ id: newId, _id: { $ne: category._id } })) {
      throw AppError.conflict(`Category with ID ${newId} already exists`);
    }
    category.id = newId;
  }

  if (data.description !== undefined) category.description = str(data.description);
  if (data.slug !== undefined) category.slug = str(data.slug);
  else if (name) category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (data.image !== undefined) category.image = await uploadBase64ToGitHub(data.image, name || category.categoryName);
  if (data.iconName !== undefined) category.iconName = str(data.iconName);
  if (data.count !== undefined) category.count = Math.max(0, toNumber(data.count));
  if (data.isActive !== undefined) category.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) category.isDeleted = toBool(data.isDeleted);

  await category.save();
  cache.invalidate("categories");
  cache.invalidate("categories_counts");
  cache.invalidate("categories_status_counts");
  logger.info(`CATEGORY_UPDATED: ${category.categoryName} (${category.id})`);
  await category.populate("vendorBy", CREATOR_POPULATE);
  return category.populate("createdBy", CREATOR_POPULATE);
};

/* ================= DELETE (soft first, permanent if already in trash) ================= */
export const deleteCategory = async (identifier: string) => {
  const category = await findCategory(identifier);

  cache.invalidate("categories");
  cache.invalidate("categories_counts");
  cache.invalidate("categories_status_counts");
  if (category.isDeleted) {
    await ProductCategory.deleteOne({ _id: category._id });
    logger.info(`CATEGORY_PERMANENTLY_DELETED: ${category.categoryName} (${category.id})`);
    return { deleted: true, message: `Category ${category.categoryName} permanently removed` };
  }

  category.isDeleted = true;
  await category.save();
  logger.info(`CATEGORY_DELETED: ${category.categoryName} (${category.id})`);
  return { deleted: true, message: `Category ${category.categoryName} deleted successfully` };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteCategories = async (body: unknown) => {
  const ids = readBulkIds(body, "categoryIds");
  const matched = await ProductCategory.find(bulkFilter(ids, ["categoryName"]));
  if (matched.length === 0) throw AppError.notFound("No matching categories found");

  cache.invalidate("categories");
  cache.invalidate("categories_counts");
  cache.invalidate("categories_status_counts");

  if (isPermanent(body)) {
    await ProductCategory.deleteMany({ _id: { $in: matched.map((c) => c._id) } });
    return { deleted: true, totalCount: matched.length, message: `${matched.length} category(s) permanently deleted` };
  }

  const hardIds = matched.filter((c) => c.isDeleted).map((c) => c._id);
  const softIds = matched.filter((c) => !c.isDeleted).map((c) => c._id);
  if (hardIds.length) await ProductCategory.deleteMany({ _id: { $in: hardIds } });
  if (softIds.length) await ProductCategory.updateMany({ _id: { $in: softIds } }, { $set: { isDeleted: true } });

  return {
    deleted: true,
    totalCount: matched.length,
    softDeletedCount: softIds.length,
    permanentlyDeletedCount: hardIds.length,
    message: `${matched.length} category(s) processed (${softIds.length} moved to trash, ${hardIds.length} permanently deleted)`,
  };
};
