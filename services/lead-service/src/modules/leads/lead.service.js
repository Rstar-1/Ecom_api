import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";

const { info, generateLeadId, buildLeadQuery } = utils;
const { Lead, User } = models;

/* ================= RESOLVE CREATOR USER ================= */
const resolveCreatorId = async (providedId) => {
  let val = providedId;
  if (val && typeof val === "object") {
    val = val._id || val.id || val.userId || val.email;
  }
  if (val) {
    const strVal = String(val).trim();
    if (mongoose.Types.ObjectId.isValid(strVal)) {
      const userDoc = await User.findById(strVal).select("_id");
      if (userDoc) return userDoc._id;
    }
    const userDoc = await User.findOne({
      $or: [{ id: strVal }, { email: strVal.toLowerCase() }],
    }).select("_id");
    if (userDoc) return userDoc._id;
  }
  const defaultUser = await User.findOne({ isDeleted: false }).select("_id");
  return defaultUser ? defaultUser._id : new mongoose.Types.ObjectId("6a8691ede8fdc4bafebc857b");
};

/* ================= CREATE LEAD ================= */
export const createLead = async (data = {}) => {
  const name = (data.name || "").trim();
  const mobile = (data.mobile || "").trim();

  if (!name) {
    const error = new Error("Lead name is required");
    error.statusCode = 400;
    throw error;
  }
  if (!mobile) {
    const error = new Error("Mobile number is required");
    error.statusCode = 400;
    throw error;
  }

  // Check if active lead already exists with same mobile
  const existingLead = await Lead.findOne({ mobile, isDeleted: false });
  if (existingLead) {
    const error = new Error(`Lead with mobile ${mobile} already exists`);
    error.statusCode = 409;
    throw error;
  }

  const id = (data.id && data.id.trim()) || (await generateLeadId());
  const createdBy = await resolveCreatorId(data.createdBy);

  const lead = await Lead.create({
    id,
    name,
    mobile,
    email: (data.email || "").trim().toLowerCase(),
    location: (data.location || "").trim(),
    description: (data.description || "").trim(),
    severity: data.severity ? String(data.severity).toLowerCase() : "pending",
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
    createdBy,
  });

  await lead.populate("createdBy", "id fullname email mobile image");
  info(`LEAD_CREATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= GET ALL LEADS (PAGINATED) ================= */
export const getLeads = async (query = {}) => {
  const { isDeleted, isActive, severity, search, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") filter.isDeleted = isDeleted === "true" || isDeleted === true;
  } else {
    filter.isDeleted = false;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (severity) {
    filter.severity = String(severity).toLowerCase().trim();
  }

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { id: { $regex: s, $options: "i" } },
      { name: { $regex: s, $options: "i" } },
      { mobile: { $regex: s, $options: "i" } },
      { email: { $regex: s, $options: "i" } },
      { location: { $regex: s, $options: "i" } },
    ];
  }

  const isPaginated = page !== undefined || limit !== undefined;
  let queryBuilder = Lead.find(filter)
    .populate("createdBy", "id fullname email mobile image")
    .sort({ createdAt: -1 });

  let currentPage = 1;
  let currentLimit = 10;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;
    total = await Lead.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const leads = await queryBuilder.lean();

  if (isPaginated) {
    return {
      leads,
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

  return leads;
};

/* ================= GET LEAD BY ID ================= */
export const getLeadById = async (identifier) => {
  const lead = await Lead.findOne(buildLeadQuery(identifier, true)).populate(
    "createdBy",
    "id fullname email mobile image"
  );
  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }
  return lead;
};

/* ================= UPDATE LEAD ================= */
export const updateLead = async (identifier, data = {}) => {
  const lead = await Lead.findOne(buildLeadQuery(identifier, true));
  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.name !== undefined) lead.name = String(data.name).trim();
  if (data.mobile !== undefined) lead.mobile = String(data.mobile).trim();
  if (data.email !== undefined) lead.email = String(data.email).trim().toLowerCase();
  if (data.location !== undefined) lead.location = String(data.location).trim();
  if (data.description !== undefined) lead.description = String(data.description).trim();
  if (data.severity !== undefined) lead.severity = String(data.severity).toLowerCase().trim();
  if (data.isActive !== undefined) lead.isActive = Boolean(data.isActive);
  if (data.isDeleted !== undefined) lead.isDeleted = Boolean(data.isDeleted);
  if (data.createdBy !== undefined) {
    lead.createdBy = await resolveCreatorId(data.createdBy);
  }

  await lead.save();
  await lead.populate("createdBy", "id fullname email mobile image");
  info(`LEAD_UPDATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= UPDATE LEAD SEVERITY ================= */
export const updateLeadSeverity = async (identifier, severity) => {
  const allowed = ["pending", "approved", "rejected"];
  const normalized = String(severity || "").toLowerCase().trim();
  if (!allowed.includes(normalized)) {
    const error = new Error(`Severity must be one of: ${allowed.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }
  return updateLead(identifier, { severity: normalized });
};

/* ================= DELETE LEAD ================= */
export const deleteLead = async (identifier, permanent = false) => {
  const lead = await Lead.findOne(buildLeadQuery(identifier, true));
  if (!lead) {
    const error = new Error("Lead not found");
    error.statusCode = 404;
    throw error;
  }

  if (permanent) {
    await Lead.deleteOne({ _id: lead._id });
    info(`LEAD_PERMANENTLY_DELETED: ${lead.name} (${lead.id})`);
    return { message: "Lead permanently deleted", id: lead.id };
  }

  lead.isDeleted = true;
  await lead.save();
  info(`LEAD_SOFT_DELETED: ${lead.name} (${lead.id})`);
  return { message: "Lead soft deleted", id: lead.id };
};

/* ================= BULK DELETE LEADS ================= */
export const bulkDeleteLeads = async ({ ids = [], permanent = false }) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error("Array of lead IDs is required");
    error.statusCode = 400;
    throw error;
  }

  const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id)).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const filter = {
    $or: [
      { _id: { $in: objectIds } },
      { id: { $in: stringIds } },
    ],
  };

  if (permanent) {
    const result = await Lead.deleteMany(filter);
    return {
      message: `${result.deletedCount} leads permanently deleted`,
      deletedCount: result.deletedCount,
    };
  }

  const result = await Lead.updateMany(filter, { $set: { isDeleted: true } });
  return {
    message: `${result.modifiedCount} leads soft deleted`,
    modifiedCount: result.modifiedCount,
  };
};

