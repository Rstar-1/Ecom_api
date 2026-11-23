import { LEAD_SEVERITIES, Lead, type LeadSeverity } from "./lead.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  identifierFilter,
  isPermanent,
  logger,
  pagedResult,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  type Filter,
} from "../../utils";
import { CREATOR_POPULATE } from "../roles/role.helpers";
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
  const name = str(f.name);
  const mobile = str(f.mobile);
  if (!name) throw AppError.badRequest("Lead Full Name is required");
  if (!mobile) throw AppError.badRequest("Mobile Number is required");

  if (await Lead.exists({ mobile, isDeleted: false })) {
    throw AppError.conflict(`Lead with mobile ${mobile} already exists`);
  }

  const severity = str(data.severity).toLowerCase();
  const notes = str(f.notes);

  const lead = await Lead.create({
    ...(str(data.id) ? { id: str(data.id) } : {}),
    name,
    mobile,
    email: str(f.email).toLowerCase(),
    location: str(f.location),
    description: notes,
    notes,
    severity: isSeverity(severity) ? severity : "low",
    isActive: f.active !== undefined ? toBool(f.active) : true,
    createdBy: createdBy ?? null,
  });

  if (lead.createdBy) await lead.populate("createdBy", CREATOR_POPULATE);
  logger.info(`LEAD_CREATED: ${lead.name} (${lead.id})`);
  return lead;
};

/* ================= LIST ================= */
export const getLeads = async (query: LeadListQuery = {}) => {
  const filter: Filter = {
    ...baseListFilter({ isDeleted: query.isDeleted, isActive: query.publishedStatus ?? query.isActive }),
    ...searchFilter(query.search, ["id", "name", "mobile", "email", "location", "description", "notes"]),
  };
  if (query.severity) filter.severity = str(query.severity).toLowerCase();

  const paging = readPagination(query, 10);
  const base = Lead.find(filter).populate("createdBy", CREATOR_POPULATE).sort({ createdAt: -1 });
  const [leads, total] = await Promise.all([
    paging.isPaginated ? base.skip(paging.skip).limit(paging.limit) : base,
    paging.isPaginated ? Lead.countDocuments(filter) : Promise.resolve(0),
  ]);

  return paging.isPaginated ? pagedResult("leads", leads, total, paging) : leads;
};

/* ================= GET ONE (Mongo _id, LED-001, mobile or email) ================= */
export const getLeadById = async (identifier: string) =>
  (await findLead(identifier)).populate("createdBy", CREATOR_POPULATE);

/* ================= UPDATE ================= */
export const updateLead = async (identifier: string, data: LeadBody) => {
  const lead = await findLead(identifier);
  const f = fields(data);

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
  if (lead.createdBy) await lead.populate("createdBy", CREATOR_POPULATE);
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

  if (isPermanent(body)) {
    const result = await Lead.deleteMany(filter);
    return { message: `${result.deletedCount} leads permanently deleted`, deletedCount: result.deletedCount };
  }

  const result = await Lead.updateMany(filter, { $set: { isDeleted: true } });
  return { message: `${result.modifiedCount} leads soft deleted`, modifiedCount: result.modifiedCount };
};
