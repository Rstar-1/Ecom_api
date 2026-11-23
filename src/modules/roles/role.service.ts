import { Role } from "./role.model";
import { User } from "../users/user.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
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
  toNumber,
} from "../../utils";
import type { RoleBody, RoleListQuery } from "./role.types";

const roleName = (data: RoleBody): string => str(data.rolename || data.roleName || data.name || data.role).toLowerCase();

const findRole = async (identifier: string) => {
  const role = await Role.findOne(identifierFilter(identifier, (v) => [{ rolename: v.toLowerCase() }]));
  if (!role) throw AppError.notFound("Role not found");
  return role;
};

/** Live number of non-deleted users per role id. */
const userCountsByRole = async (): Promise<Map<string, number>> => {
  const counts = await User.aggregate<{ _id: unknown; count: number }>([
    { $match: { isDeleted: false } },
    { $group: { _id: "$roleId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
};

/* ================= CREATE (updates/restores if already exists) ================= */
export const createRole = async (data: RoleBody) => {
  const rolename = roleName(data);
  if (!rolename) throw AppError.badRequest("Role name is required");

  const existing = await Role.findOne({
    $or: [{ rolename }, { name: rolename }],
  });
  if (existing) {
    existing.isDeleted = false;
    existing.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
    if (data.permissions !== undefined) existing.set("permissions", parseList(data.permissions));
    if (data.pages !== undefined) existing.set("pages", parseList(data.pages));
    if (data.count !== undefined) existing.count = toNumber(data.count);
    await existing.save();
    logger.info(`ROLE_UPDATED: ${existing.rolename} (${existing.id})`);
    return existing;
  }

  const role = await Role.create({
    ...(str(data.id) ? { id: str(data.id) } : {}),
    rolename,
    permissions: parseList(data.permissions),
    pages: parseList(data.pages),
    count: toNumber(data.count),
    isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
  });
  logger.info(`ROLE_CREATED: ${role.rolename} (${role.id})`);
  return role;
};

/* ================= LIST (pagination only when ?page / ?limit is sent) ================= */
export const getRoles = async (query: RoleListQuery = {}) => {
  const filter = { ...baseListFilter(query), ...searchFilter(query.search, ["id", "rolename"]) };
  const paging = readPagination(query, 10);
  const countMap = await userCountsByRole();

  const [rolesList, total] = await Promise.all([
    paging.isPaginated
      ? Role.find(filter).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean()
      : Role.find(filter).sort({ createdAt: -1 }).lean(),
    paging.isPaginated ? Role.countDocuments(filter) : Promise.resolve(0),
  ]);

  const withCounts = rolesList.map((r) => ({ ...r, count: countMap.get(String(r._id)) ?? r.count ?? 0 }));
  return paging.isPaginated ? pagedResult("roles", withCounts, total, paging) : withCounts;
};

/* ================= GET ONE ================= */
export const getRoleById = async (identifier: string) => {
  const role = await findRole(identifier);
  const count = await User.countDocuments({ roleId: role._id, isDeleted: false });
  return { ...role.toObject(), count };
};

/* ================= UPDATE ================= */
export const updateRole = async (identifier: string, data: RoleBody) => {
  const role = await findRole(identifier);

  const rolename = roleName(data);
  if (rolename) {
    role.rolename = rolename;
  }

  const newId = str(data.id);
  if (newId && newId !== role.id) {
    if (await Role.exists({ id: newId, _id: { $ne: role._id } })) {
      throw AppError.conflict(`Role with ID ${newId} already exists`);
    }
    role.id = newId;
  }

  if (data.permissions !== undefined) role.set("permissions", parseList(data.permissions));
  if (data.pages !== undefined) role.set("pages", parseList(data.pages));
  if (data.count !== undefined) role.count = Math.max(0, toNumber(data.count));
  if (data.isActive !== undefined) role.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) role.isDeleted = toBool(data.isDeleted);

  await role.save();
  logger.info(`ROLE_UPDATED: ${role.rolename} (${role.id})`);
  return role;
};

/* ================= DELETE (soft first, permanent if already in trash) ================= */
export const deleteRole = async (identifier: string) => {
  const role = await findRole(identifier);

  if (role.isDeleted) {
    await Role.deleteOne({ _id: role._id });
    logger.info(`ROLE_PERMANENTLY_DELETED: ${role.rolename} (${role.id})`);
    return { deleted: true, message: `Role ${role.rolename} permanently removed` };
  }

  role.isDeleted = true;
  await role.save();
  logger.info(`ROLE_DELETED: ${role.rolename} (${role.id})`);
  return { deleted: true, message: `Role ${role.rolename} deleted successfully` };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteRoles = async (body: unknown) => {
  const ids = readBulkIds(body, "roleIds");
  const matched = await Role.find(bulkFilter(ids.concat(ids.map((i) => i.toLowerCase())), ["rolename"]));
  if (matched.length === 0) throw AppError.notFound("No matching roles found");

  if (isPermanent(body)) {
    await Role.deleteMany({ _id: { $in: matched.map((r) => r._id) } });
    logger.info(`ROLES_PERMANENTLY_BULK_DELETED: ${matched.length}`);
    return { deleted: true, totalCount: matched.length, message: `${matched.length} role(s) permanently deleted` };
  }

  const hardIds = matched.filter((r) => r.isDeleted).map((r) => r._id);
  const softIds = matched.filter((r) => !r.isDeleted).map((r) => r._id);
  if (hardIds.length) await Role.deleteMany({ _id: { $in: hardIds } });
  if (softIds.length) await Role.updateMany({ _id: { $in: softIds } }, { $set: { isDeleted: true } });

  logger.info(`ROLES_BULK_DELETED: ${softIds.length} soft, ${hardIds.length} permanent`);
  return {
    deleted: true,
    totalCount: matched.length,
    softDeletedCount: softIds.length,
    permanentlyDeletedCount: hardIds.length,
    message: `${matched.length} role(s) processed (${softIds.length} moved to trash, ${hardIds.length} permanently deleted)`,
  };
};
