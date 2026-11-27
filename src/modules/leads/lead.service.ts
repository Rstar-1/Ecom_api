import mongoose from "mongoose";
import { LEAD_CATEGORIES, LEAD_SEVERITIES, Lead, type LeadSeverity, type LeadCategory } from "./lead.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  cache,
  identifierFilter,
  isObjectId,
  isPermanent,
  logger,
  pagedResult,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  toNumber,
  type Filter,
} from "../../utils";
import { CREATOR_POPULATE, getCreatorOrAdminFilter } from "../roles/role.helpers";
import type { LeadBody, LeadListQuery } from "./lead.types";

const isSeverity = (value: string): value is LeadSeverity => (LEAD_SEVERITIES as readonly string[]).includes(value);

/** First defined value among the aliases (so "" can clear a field). */
const pick = (...values: Array<string | undefined>): string | undefined => values.find((v) => v !== undefined);

const fields = (data: LeadBody) => ({
  name: pick(data.name, data.leadFullName, data.fullName),
  mobile: pick(data.mobile, data.mobileNumber, data.phone, data.contactNumber),
  email: pick(data.email, data.emailAddress),
  location: pick(data.location, data.address, data.city),
  notes: pick(data.requirementDetails, data.notes, data.description, data.requirements),
  active: data.publishedStatus ?? data.isActive,
});

const findLead = async (identifier: string) => {
  const lead = await Lead.findOne(identifierFilter(identifier, (v) => [{ mobile: v }, { email: v.toLowerCase() }]));
  if (!lead) throw AppError.notFound("Lead not found");
  return lead;
};

/* ================= CREATE ================= */
export const createLead = async (data: LeadBody, createdBy?: string) => {
  const f = fields(data);
  let name = str(f.name);
  const mobile = str(f.mobile);
  const rawCat = str(data.category).toLowerCase();
  const category: LeadCategory = (LEAD_CATEGORIES as readonly string[]).includes(rawCat) ? (rawCat as LeadCategory) : "enquiry";

  if (category !== "product") {
    if (!name) throw AppError.badRequest("Lead Full Name is required");
    if (!mobile) throw AppError.badRequest("Mobile Number is required");
  } else {
    if (!name) {
      name = "Product Lead";
    }
  }

  if (mobile && (await Lead.exists({ mobile, isDeleted: false }))) {
    throw AppError.conflict(`Lead with mobile ${mobile} already exists`);
  }

  const severity = str(data.severity).toLowerCase();
  const notes = str(f.notes);

  let products: mongoose.Types.ObjectId[] = [];
  if (Array.isArray(data.products)) {
    products = data.products.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
  } else if (typeof data.products === "string" && isObjectId(data.products)) {
    products = [new mongoose.Types.ObjectId(data.products)];
  }

  const lead = new Lead({
    ...(str(data.id) ? { id: str(data.id) } : {}),
    category,
    products,
    quantity: toNumber(data.quantity, 1),
    name,
    mobile,
    email: str(f.email).toLowerCase(),
    location: str(f.location),
    description: notes,
    notes,
    severity: isSeverity(severity) ? severity : "low",
    isActive: f.active !== undefined ? toBool(f.active) : true,
    createdBy: createdBy && isObjectId(createdBy) ? new mongoose.Types.ObjectId(createdBy) : null,
  });
  await lead.save();

  if (lead.createdBy) await lead.populate("createdBy", CREATOR_POPULATE);
  if (lead.products?.length) await lead.populate("products", "id productName price image");
  cache.invalidate("leads");
  logger.info(`LEAD_CREATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= LIST ================= */
export const getLeads = async (query: LeadListQuery = {}) => {
  return cache.wrap(
    "leads",
    query as Record<string, unknown>,
    async () => {
      const filter: Filter = {
        ...baseListFilter({ isDeleted: query.isDeleted, isActive: query.publishedStatus ?? query.isActive }),
        ...searchFilter(query.search, ["id", "name", "mobile", "email", "location", "description", "notes"]),
      };
      if (query.severity) filter.severity = str(query.severity).toLowerCase();
      if (query.category) {
        const catStr = str(query.category).toLowerCase().trim();
        const normalizedCat = (catStr === "orders" || catStr === "product")
          ? "product"
          : (catStr === "leads" || catStr === "manual")
            ? "manual"
            : catStr;
        filter.category = normalizedCat;
      }

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
      const base = Lead.find(filter)
        .populate("createdBy", CREATOR_POPULATE)
        .populate("products", "id productName price image")
        .sort({ createdAt: -1 });

      const categoryScope = filter.category ? { category: filter.category } : {};
      const activeFilter: Filter = { isDeleted: false, isActive: true, ...categoryScope, ...(creatorScope ? creatorScope : {}) };
      const inactiveFilter: Filter = { isDeleted: false, isActive: false, ...categoryScope, ...(creatorScope ? creatorScope : {}) };
      const trashFilter: Filter = { isDeleted: true, ...categoryScope, ...(creatorScope ? creatorScope : {}) };
      const highFilter: Filter = { isDeleted: false, severity: "high", ...categoryScope, ...(creatorScope ? creatorScope : {}) };
      const mediumFilter: Filter = { isDeleted: false, severity: "medium", ...categoryScope, ...(creatorScope ? creatorScope : {}) };
      const lowFilter: Filter = { isDeleted: false, severity: "low", ...categoryScope, ...(creatorScope ? creatorScope : {}) };

      const [leads, total, active, inactive, trash, high, medium, low] = await Promise.all([
        base.skip(paging.skip).limit(paging.limit).lean(),
        Lead.countDocuments(filter),
        Lead.countDocuments(activeFilter),
        Lead.countDocuments(inactiveFilter),
        Lead.countDocuments(trashFilter),
        Lead.countDocuments(highFilter),
        Lead.countDocuments(mediumFilter),
        Lead.countDocuments(lowFilter),
      ]);

      const result: any = pagedResult("leads", leads, total, paging);
      result.counts = {
        all: active + inactive,
        active,
        inactive,
        trash,
        high,
        medium,
        low,
      };
      return result;
    },
    30
  );
};

/* ================= GET ONE (Mongo _id, LED-001, mobile or email) ================= */
export const getLeadById = async (identifier: string) =>
  (await findLead(identifier)).populate([
    { path: "createdBy", select: CREATOR_POPULATE },
    { path: "products", select: "id productName price image" },
  ]);

/* ================= UPDATE ================= */
export const updateLead = async (identifier: string, data: LeadBody) => {
  const lead = await findLead(identifier);
  const f = fields(data);

  if (data.category !== undefined) {
    const rawCat = str(data.category).toLowerCase();
    if ((LEAD_CATEGORIES as readonly string[]).includes(rawCat as any)) {
      lead.set("category", rawCat);
    }
  }
  if (data.products !== undefined) {
    let products: any[] = [];
    if (Array.isArray(data.products)) {
      products = data.products.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
    } else if (typeof data.products === "string" && isObjectId(data.products)) {
      products = [new mongoose.Types.ObjectId(data.products)];
    }
    lead.set("products", products);
  }
  if (data.quantity !== undefined) {
    lead.set("quantity", toNumber(data.quantity, 1));
  }

  if (f.name !== undefined) lead.name = str(f.name);
  if (f.mobile !== undefined) lead.mobile = str(f.mobile);
  if (f.email !== undefined) lead.email = str(f.email).toLowerCase();
  if (f.location !== undefined) lead.location = str(f.location);
  if (f.notes !== undefined) {
    lead.description = str(f.notes);
    lead.notes = str(f.notes);
  }
  if (data.severity !== undefined) {
    const severity = str(data.severity).toLowerCase();
    if (isSeverity(severity)) lead.severity = severity;
  }
  if (f.active !== undefined) lead.isActive = toBool(f.active);
  if (data.isDeleted !== undefined) lead.isDeleted = toBool(data.isDeleted);

  await lead.save();
  cache.invalidate("leads");
  if (lead.createdBy) await lead.populate("createdBy", CREATOR_POPULATE);
  if (lead.products?.length) await lead.populate("products", "id productName price image");
  logger.info(`LEAD_UPDATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= UPDATE SEVERITY ================= */
export const updateLeadSeverity = (identifier: string, severity: unknown) => {
  const normalized = str(severity).toLowerCase();
  if (!isSeverity(normalized)) {
    throw AppError.badRequest(`Severity must be one of: ${LEAD_SEVERITIES.join(", ")}`);
  }
  return updateLead(identifier, { severity: normalized });
};

/* ================= DELETE (?permanent=true for hard delete) ================= */
export const deleteLead = async (identifier: string, permanent: boolean) => {
  const lead = await findLead(identifier);

  cache.invalidate("leads");
  if (permanent) {
    await Lead.deleteOne({ _id: lead._id });
    logger.info(`LEAD_PERMANENTLY_DELETED: ${lead.name} (${lead.id})`);
    return { message: "Lead permanently deleted", id: lead.id };
  }

  lead.isDeleted = true;
  await lead.save();
  logger.info(`LEAD_SOFT_DELETED: ${lead.name} (${lead.id})`);
  return { message: "Lead soft deleted", id: lead.id };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteLeads = async (body: unknown) => {
  const filter = bulkFilter(readBulkIds(body, "leadIds"));
  cache.invalidate("leads");

  if (isPermanent(body)) {
    const result = await Lead.deleteMany(filter);
    return { message: `${result.deletedCount} leads permanently deleted`, deletedCount: result.deletedCount };
  }

  const result = await Lead.updateMany(filter, { $set: { isDeleted: true } });
  return { message: `${result.modifiedCount} leads soft deleted`, modifiedCount: result.modifiedCount };
};
