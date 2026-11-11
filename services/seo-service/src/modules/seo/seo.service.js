import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";
import { initialSeoData } from "../../config/seedData.js";

const { info, generateSeoId, buildSeoQuery } = utils;
const { SEO, User } = models;

/* ================= RESOLVE CREATOR USER ================= */
const resolveCreatorId = async (providedId) => {
  if (providedId) {
    if (mongoose.Types.ObjectId.isValid(providedId)) {
      return new mongoose.Types.ObjectId(providedId);
    }
    const userDoc = await User.findOne({
      $or: [{ id: providedId }, { email: String(providedId).toLowerCase() }],
    });
    if (userDoc) return userDoc._id;
  }
  const defaultUser = await User.findOne({ isDeleted: false });
  return defaultUser ? defaultUser._id : new mongoose.Types.ObjectId("6a8691ede8fdc4bafebc857b");
};

/* ================= PARSE BREADCRUMBS ================= */
const parseBreadcrumbs = (breadcrumbs) => {
  if (!breadcrumbs) return [];
  if (Array.isArray(breadcrumbs)) return breadcrumbs;
  if (typeof breadcrumbs === "string") {
    try {
      const parsed = JSON.parse(breadcrumbs);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/* ================= SEED INITIAL SEO DATA ================= */
export const seedInitialSeo = async (force = false) => {
  const count = await SEO.countDocuments();
  if (count > 0 && !force) {
    return { message: `SEO collection already has ${count} records. Pass force=true to re-seed.`, count };
  }

  const creatorId = await resolveCreatorId();
  let seededCount = 0;

  for (const item of initialSeoData) {
    const filter = { $or: [{ id: item.id }, { name: item.name }] };
    const updateDoc = {
      ...item,
      createdBy: mongoose.Types.ObjectId.isValid(item.createdBy)
        ? new mongoose.Types.ObjectId(item.createdBy)
        : creatorId,
    };

    await SEO.findOneAndUpdate(filter, updateDoc, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true });
    seededCount++;
  }

  info(`SEO_INITIAL_SEEDED: ${seededCount} pages populated`);
  return { message: `Successfully seeded ${seededCount} SEO records`, count: seededCount };
};

/* ================= CREATE SEO CONFIG ================= */
export const createSeo = async (data = {}) => {
  const name = (data.name || "").trim().toLowerCase();
  const path = (data.path || "").trim();

  if (!name) {
    const error = new Error("Page name is required");
    error.statusCode = 400;
    throw error;
  }
  if (!path) {
    const error = new Error("URL path is required");
    error.statusCode = 400;
    throw error;
  }

  // Check if SEO with this name or path already exists
  const existing = await SEO.findOne({
    $or: [{ name }, { path }],
  });

  if (existing) {
    if (existing.isDeleted) {
      existing.isDeleted = false;
      existing.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
      if (data.title !== undefined) existing.title = data.title;
      if (data.description !== undefined) existing.description = data.description;
      if (data.keywords !== undefined) existing.keywords = data.keywords;
      if (data.image !== undefined) existing.image = data.image;
      if (data.type !== undefined) existing.type = data.type;
      if (data.noindex !== undefined) existing.noindex = Boolean(data.noindex);
      if (data.breadcrumbs !== undefined) existing.breadcrumbs = parseBreadcrumbs(data.breadcrumbs);
      await existing.save();
      info(`SEO_RESTORED_AND_UPDATED: ${existing.name} (${existing.id})`);
      return existing;
    }
    const error = new Error(`SEO config for "${name}" or path "${path}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  if (data.id && data.id.trim()) {
    const existingId = await SEO.findOne({ id: data.id.trim() });
    if (existingId) {
      const error = new Error(`SEO config with ID ${data.id.trim()} already exists`);
      error.statusCode = 409;
      throw error;
    }
  }

  const id = (data.id && data.id.trim()) || (await generateSeoId());
  const createdBy = await resolveCreatorId(data.createdBy);

  const seo = await SEO.create({
    id,
    name,
    page: (data.page || name).trim(),
    path,
    title: (data.title || "").trim(),
    description: (data.description || "").trim(),
    keywords: (data.keywords || "").trim(),
    image: (data.image || "").trim(),
    type: data.type ? String(data.type).toLowerCase().trim() : "website",
    noindex: Boolean(data.noindex),
    breadcrumbs: parseBreadcrumbs(data.breadcrumbs),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
    createdBy,
  });

  info(`SEO_CREATED: ${seo.name} (${seo.id})`);
  return seo;
};

/* ================= GET ALL SEO CONFIGS (PAGINATED) ================= */
export const getSeoList = async (query = {}) => {
  const { isDeleted, isActive, type, search, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") filter.isDeleted = isDeleted === "true" || isDeleted === true;
  } else {
    filter.isDeleted = false;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (type) {
    filter.type = String(type).toLowerCase().trim();
  }

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { id: { $regex: s, $options: "i" } },
      { name: { $regex: s, $options: "i" } },
      { page: { $regex: s, $options: "i" } },
      { path: { $regex: s, $options: "i" } },
      { title: { $regex: s, $options: "i" } },
      { description: { $regex: s, $options: "i" } },
      { keywords: { $regex: s, $options: "i" } },
    ];
  }

  const isPaginated = page !== undefined || limit !== undefined;
  let queryBuilder = SEO.find(filter)
    .populate("createdBy", "id fullname email mobile")
    .sort({ createdAt: 1 });

  let currentPage = 1;
  let currentLimit = 20;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (currentPage - 1) * currentLimit;
    total = await SEO.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const seos = await queryBuilder.lean();

  if (isPaginated) {
    return {
      seos,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  return seos;
};

/* ================= GET SEO BY ID OR IDENTIFIER ================= */
export const getSeoById = async (identifier) => {
  const seo = await SEO.findOne(buildSeoQuery(identifier, true)).populate(
    "createdBy",
    "id fullname email mobile"
  );
  if (!seo) {
    const error = new Error("SEO configuration not found");
    error.statusCode = 404;
    throw error;
  }
  return seo;
};

/* ================= GET SEO BY PAGE NAME ================= */
export const getSeoByPage = async (pageName) => {
  if (!pageName) {
    const error = new Error("Page identifier is required");
    error.statusCode = 400;
    throw error;
  }
  const clean = String(pageName).trim();
  const regex = new RegExp(`^${clean}$`, "i");

  const seo = await SEO.findOne({
    $or: [{ name: regex }, { page: regex }, { id: clean }],
    isDeleted: false,
  }).populate("createdBy", "id fullname email mobile");

  if (!seo) {
    const error = new Error(`SEO configuration for page "${pageName}" not found`);
    error.statusCode = 404;
    throw error;
  }
  return seo;
};

/* ================= GET SEO BY PATH ================= */
export const getSeoByPath = async (urlPath) => {
  if (!urlPath) {
    const error = new Error("URL path is required");
    error.statusCode = 400;
    throw error;
  }
  const clean = String(urlPath).trim();
  const seo = await SEO.findOne({ path: clean, isDeleted: false }).populate(
    "createdBy",
    "id fullname email mobile"
  );

  if (!seo) {
    const error = new Error(`SEO configuration for path "${urlPath}" not found`);
    error.statusCode = 404;
    throw error;
  }
  return seo;
};

/* ================= UPDATE SEO CONFIG ================= */
export const updateSeo = async (identifier, data = {}) => {
  const seo = await SEO.findOne(buildSeoQuery(identifier, true));
  if (!seo) {
    const error = new Error("SEO configuration not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.name !== undefined && data.name.trim()) {
    const name = data.name.trim().toLowerCase();
    const existing = await SEO.findOne({
      name,
      _id: { $ne: seo._id },
      isDeleted: false,
    });
    if (existing) {
      const error = new Error(`SEO configuration with name "${name}" already exists`);
      error.statusCode = 409;
      throw error;
    }
    seo.name = name;
  }

  if (data.page !== undefined) seo.page = String(data.page).trim();
  if (data.path !== undefined) seo.path = String(data.path).trim();
  if (data.title !== undefined) seo.title = String(data.title).trim();
  if (data.description !== undefined) seo.description = String(data.description).trim();
  if (data.keywords !== undefined) seo.keywords = String(data.keywords).trim();
  if (data.image !== undefined) seo.image = String(data.image).trim();
  if (data.type !== undefined) seo.type = String(data.type).toLowerCase().trim();
  if (data.noindex !== undefined) seo.noindex = Boolean(data.noindex);
  if (data.breadcrumbs !== undefined) seo.breadcrumbs = parseBreadcrumbs(data.breadcrumbs);
  if (data.isActive !== undefined) seo.isActive = Boolean(data.isActive);
  if (data.isDeleted !== undefined) seo.isDeleted = Boolean(data.isDeleted);

  await seo.save();
  info(`SEO_UPDATED: ${seo.name} (${seo.id})`);
  return seo;
};

/* ================= DELETE SEO CONFIG ================= */
export const deleteSeo = async (identifier, permanent = false) => {
  const seo = await SEO.findOne(buildSeoQuery(identifier, true));
  if (!seo) {
    const error = new Error("SEO configuration not found");
    error.statusCode = 404;
    throw error;
  }

  if (permanent) {
    await SEO.deleteOne({ _id: seo._id });
    info(`SEO_PERMANENTLY_DELETED: ${seo.name} (${seo.id})`);
    return { message: "SEO configuration permanently deleted", id: seo.id };
  }

  seo.isDeleted = true;
  await seo.save();
  info(`SEO_SOFT_DELETED: ${seo.name} (${seo.id})`);
  return { message: "SEO configuration soft deleted", id: seo.id };
};

/* ================= BULK DELETE SEO CONFIGS ================= */
export const bulkDeleteSeo = async ({ ids = [], permanent = false }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error("Array of SEO IDs is required");
    error.statusCode = 400;
    throw error;
  }

  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const filter = {
    $or: [{ _id: { $in: objectIds } }, { id: { $in: stringIds } }, { name: { $in: stringIds } }],
  };

  if (permanent) {
    const result = await SEO.deleteMany(filter);
    return {
      message: `${result.deletedCount} SEO configurations permanently deleted`,
      deletedCount: result.deletedCount,
    };
  }

  const result = await SEO.updateMany(filter, { $set: { isDeleted: true } });
  return {
    message: `${result.modifiedCount} SEO configurations soft deleted`,
    modifiedCount: result.modifiedCount,
  };
};
