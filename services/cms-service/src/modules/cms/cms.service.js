import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";

const { info, generateCmsId, buildCmsQuery } = utils;
const { CMS, User } = models;

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

/* ================= PARSE CMS DATA ================= */
const parseCmsData = (cmsData) => {
  if (!cmsData) return [];
  if (Array.isArray(cmsData)) return cmsData;
  if (typeof cmsData === "string") {
    try {
      const parsed = JSON.parse(cmsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/* ================= CREATE CMS SECTION ================= */
export const createCms = async (data = {}) => {
  const sectionName = (data.sectionName || "").trim();

  if (!sectionName) {
    const error = new Error("Section name is required");
    error.statusCode = 400;
    throw error;
  }

  // Check if section with this name already exists
  const existing = await CMS.findOne({ sectionName });
  if (existing) {
    if (existing.isDeleted) {
      existing.isDeleted = false;
      existing.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
      if (data.cmsData) existing.cmsData = parseCmsData(data.cmsData);
      await existing.save();
      info(`CMS_RESTORED_AND_UPDATED: ${existing.sectionName} (${existing.id})`);
      return existing;
    }
    const error = new Error(`CMS section "${sectionName}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  if (data.id && data.id.trim()) {
    const existingId = await CMS.findOne({ id: data.id.trim() });
    if (existingId) {
      const error = new Error(`CMS with ID ${data.id.trim()} already exists`);
      error.statusCode = 409;
      throw error;
    }
  }

  const id = (data.id && data.id.trim()) || (await generateCmsId());
  const createdBy = await resolveCreatorId(data.createdBy);

  const cms = await CMS.create({
    id,
    sectionName,
    cmsData: parseCmsData(data.cmsData),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
    createdBy,
  });

  info(`CMS_CREATED: ${cms.sectionName} (${cms.id})`);
  return cms;
};

/* ================= GET ALL CMS SECTIONS (PAGINATED) ================= */
export const getCmsList = async (query = {}) => {
  const { isDeleted, isActive, search, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") filter.isDeleted = isDeleted === "true" || isDeleted === true;
  } else {
    filter.isDeleted = false;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { id: { $regex: s, $options: "i" } },
      { sectionName: { $regex: s, $options: "i" } },
      { "cmsData.label": { $regex: s, $options: "i" } },
      { "cmsData.text": { $regex: s, $options: "i" } },
    ];
  }

  const isPaginated = page !== undefined || limit !== undefined;
  let queryBuilder = CMS.find(filter)
    .populate("createdBy", "id fullname email mobile")
    .sort({ createdAt: -1 });

  let currentPage = 1;
  let currentLimit = 10;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;
    total = await CMS.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const sections = await queryBuilder.lean();

  if (isPaginated) {
    return {
      sections,
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

  return sections;
};

/* ================= GET CMS BY ID OR SECTION NAME ================= */
export const getCmsById = async (identifier) => {
  const cms = await CMS.findOne(buildCmsQuery(identifier, true)).populate(
    "createdBy",
    "id fullname email mobile"
  );
  if (!cms) {
    const error = new Error("CMS section not found");
    error.statusCode = 404;
    throw error;
  }
  return cms;
};

/* ================= GET CMS BY SECTION NAME ================= */
export const getCmsBySectionName = async (sectionName) => {
  if (!sectionName) {
    const error = new Error("Section name is required");
    error.statusCode = 400;
    throw error;
  }
  const regex = new RegExp(`^${sectionName.trim().replace(/-/g, " ")}$`, "i");
  const cms = await CMS.findOne({
    $or: [{ sectionName: regex }, { id: sectionName.trim() }],
    isDeleted: false,
  }).populate("createdBy", "id fullname email mobile");

  if (!cms) {
    const error = new Error(`Section "${sectionName}" not found`);
    error.statusCode = 404;
    throw error;
  }
  return cms;
};

/* ================= UPDATE CMS SECTION ================= */
export const updateCms = async (identifier, data = {}) => {
  const cms = await CMS.findOne(buildCmsQuery(identifier, true));
  if (!cms) {
    const error = new Error("CMS section not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.sectionName !== undefined && data.sectionName.trim()) {
    const sectionName = data.sectionName.trim();
    const existing = await CMS.findOne({
      sectionName,
      _id: { $ne: cms._id },
      isDeleted: false,
    });
    if (existing) {
      const error = new Error(`Section with name "${sectionName}" already exists`);
      error.statusCode = 409;
      throw error;
    }
    cms.sectionName = sectionName;
  }

  if (data.cmsData !== undefined) {
    cms.cmsData = parseCmsData(data.cmsData);
  }
  if (data.isActive !== undefined) cms.isActive = Boolean(data.isActive);
  if (data.isDeleted !== undefined) cms.isDeleted = Boolean(data.isDeleted);

  await cms.save();
  info(`CMS_UPDATED: ${cms.sectionName} (${cms.id})`);
  return cms;
};

/* ================= ADD OR UPDATE SPECIFIC CMS ITEM ================= */
export const addOrUpdateCmsItem = async (identifier, itemData = {}) => {
  if (!itemData.cmsId) {
    const error = new Error("cmsId is required for CMS item");
    error.statusCode = 400;
    throw error;
  }
  if (!itemData.type || !["text", "image", "array"].includes(itemData.type)) {
    const error = new Error("type must be one of 'text', 'image', or 'array'");
    error.statusCode = 400;
    throw error;
  }

  const cms = await CMS.findOne(buildCmsQuery(identifier, true));
  if (!cms) {
    const error = new Error("CMS section not found");
    error.statusCode = 404;
    throw error;
  }

  const existingIndex = cms.cmsData.findIndex((item) => item.cmsId === itemData.cmsId);
  if (existingIndex >= 0) {
    cms.cmsData[existingIndex] = {
      ...cms.cmsData[existingIndex].toObject?.() || cms.cmsData[existingIndex],
      ...itemData,
    };
  } else {
    cms.cmsData.push(itemData);
  }

  await cms.save();
  info(`CMS_ITEM_SAVED: ${itemData.cmsId} in ${cms.sectionName}`);
  return cms;
};

/* ================= DELETE SPECIFIC CMS ITEM ================= */
export const deleteCmsItem = async (identifier, cmsId) => {
  const cms = await CMS.findOne(buildCmsQuery(identifier, true));
  if (!cms) {
    const error = new Error("CMS section not found");
    error.statusCode = 404;
    throw error;
  }

  cms.cmsData = cms.cmsData.filter((item) => item.cmsId !== cmsId);
  await cms.save();
  info(`CMS_ITEM_DELETED: ${cmsId} in ${cms.sectionName}`);
  return cms;
};

/* ================= DELETE CMS SECTION ================= */
export const deleteCms = async (identifier, permanent = false) => {
  const cms = await CMS.findOne(buildCmsQuery(identifier, true));
  if (!cms) {
    const error = new Error("CMS section not found");
    error.statusCode = 404;
    throw error;
  }

  if (permanent) {
    await CMS.deleteOne({ _id: cms._id });
    info(`CMS_PERMANENTLY_DELETED: ${cms.sectionName} (${cms.id})`);
    return { message: "CMS section permanently deleted", id: cms.id };
  }

  cms.isDeleted = true;
  await cms.save();
  info(`CMS_SOFT_DELETED: ${cms.sectionName} (${cms.id})`);
  return { message: "CMS section soft deleted", id: cms.id };
};

/* ================= BULK DELETE CMS SECTIONS ================= */
export const bulkDeleteCms = async ({ ids = [], permanent = false }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error("Array of CMS IDs is required");
    error.statusCode = 400;
    throw error;
  }

  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const filter = {
    $or: [{ _id: { $in: objectIds } }, { id: { $in: stringIds } }],
  };

  if (permanent) {
    const result = await CMS.deleteMany(filter);
    return {
      message: `${result.deletedCount} CMS sections permanently deleted`,
      deletedCount: result.deletedCount,
    };
  }

  const result = await CMS.updateMany(filter, { $set: { isDeleted: true } });
  return {
    message: `${result.modifiedCount} CMS sections soft deleted`,
    modifiedCount: result.modifiedCount,
  };
};

