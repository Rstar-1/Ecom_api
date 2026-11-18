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
  try {
    const defaultUser = await User.findOne({ isDeleted: false }).select("_id");
    if (defaultUser) return defaultUser._id;
  } catch {}
  return null;
};

/* ================= CREATE LEAD ================= */
export const createLead = async (data = {}) => {
  const name = (data.name || data.leadFullName || data.fullName || "").trim();
  const mobile = (data.mobile || data.mobileNumber || data.phone || data.contactNumber || "").trim();
  const email = (data.email || data.emailAddress || "").trim().toLowerCase();
  const location = (data.location || data.address || data.city || "").trim();
  const notes = (data.requirementDetails || data.notes || data.description || data.requirements || "").trim();

  let severity = "low";
  if (data.severity) {
    const sev = String(data.severity).trim().toLowerCase();
    if (["low", "medium", "high"].includes(sev)) {
      severity = sev;
    }
  }

  let isActive = true;
  if (data.publishedStatus !== undefined) {
    isActive =
      data.publishedStatus === true ||
      data.publishedStatus === "true" ||
      data.publishedStatus === 1 ||
      data.publishedStatus === "1";
  } else if (data.isActive !== undefined) {
    isActive =
      data.isActive === true ||
      data.isActive === "true" ||
      data.isActive === 1 ||
      data.isActive === "1";
  }

  if (!name) {
    const error = new Error("Lead Full Name is required");
    error.statusCode = 400;
    throw error;
  }
  if (!mobile) {
    const error = new Error("Mobile Number is required");
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

  const leadPayload = {
    id,
    name,
    mobile,
    email,
    location,
    description: notes,
    notes,
    severity,
    isActive,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
  };

  if (createdBy) {
    leadPayload.createdBy = createdBy;
  }

  const lead = await Lead.create(leadPayload);

  if (lead.createdBy) {
    await lead.populate("createdBy", "id fullname email mobile image");
  }
  info(`LEAD_CREATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= GET ALL LEADS (PAGINATED & FILTERED) ================= */
export const getLeads = async (query = {}) => {
  const { isDeleted, isActive, publishedStatus, severity, search, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") filter.isDeleted = isDeleted === "true" || isDeleted === true;
  } else {
    filter.isDeleted = false;
  }

  const activeStatus = publishedStatus !== undefined ? publishedStatus : isActive;
  if (activeStatus !== undefined) {
    filter.isActive = activeStatus === "true" || activeStatus === true;
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
      { description: { $regex: s, $options: "i" } },
      { notes: { $regex: s, $options: "i" } },
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

  const leads = await queryBuilder.lean({ virtuals: true });

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

  const name =
    data.name !== undefined
      ? data.name
      : data.leadFullName !== undefined
      ? data.leadFullName
      : data.fullName;
  if (name !== undefined) lead.name = String(name).trim();

  const mobile =
    data.mobile !== undefined
      ? data.mobile
      : data.mobileNumber !== undefined
      ? data.mobileNumber
      : data.phone !== undefined
      ? data.phone
      : data.contactNumber;
  if (mobile !== undefined) lead.mobile = String(mobile).trim();

  const email = data.email !== undefined ? data.email : data.emailAddress;
  if (email !== undefined) lead.email = String(email).trim().toLowerCase();

  const location =
    data.location !== undefined
      ? data.location
      : data.address !== undefined
      ? data.address
      : data.city;
  if (location !== undefined) lead.location = String(location).trim();

  const notes =
    data.requirementDetails !== undefined
      ? data.requirementDetails
      : data.notes !== undefined
      ? data.notes
      : data.description !== undefined
      ? data.description
      : data.requirements;
  if (notes !== undefined) {
    lead.description = String(notes).trim();
    lead.notes = String(notes).trim();
  }

  if (data.severity !== undefined) {
    const sev = String(data.severity).trim().toLowerCase();
    if (["low", "medium", "high"].includes(sev)) {
      lead.severity = sev;
    }
  }

  if (data.publishedStatus !== undefined) {
    lead.isActive =
      data.publishedStatus === true ||
      data.publishedStatus === "true" ||
      data.publishedStatus === 1 ||
      data.publishedStatus === "1";
  } else if (data.isActive !== undefined) {
    lead.isActive =
      data.isActive === true ||
      data.isActive === "true" ||
      data.isActive === 1 ||
      data.isActive === "1";
  }

  if (data.isDeleted !== undefined) lead.isDeleted = Boolean(data.isDeleted);
  if (data.createdBy !== undefined) {
    const creator = await resolveCreatorId(data.createdBy);
    if (creator) lead.createdBy = creator;
  }

  await lead.save();
  if (lead.createdBy) {
    await lead.populate("createdBy", "id fullname email mobile image");
  }
  info(`LEAD_UPDATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= UPDATE LEAD SEVERITY ================= */
export const updateLeadSeverity = async (identifier, severity) => {
  const allowed = ["low", "medium", "high"];
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
