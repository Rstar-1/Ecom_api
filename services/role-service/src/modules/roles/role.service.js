import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";

const { info, buildRoleQuery, generateRoleId } = utils;
const { Role, User } = models;

/* ================= CREATE ROLE ================= */
export const createRole = async (data = {}) => {
  const rawName = data?.rolename || data?.roleName || data?.name || data?.role;
  if (!rawName || !rawName.trim()) {
    const error = new Error("Role name is required");
    error.statusCode = 400;
    throw error;
  }

  const rolename = rawName.trim().toLowerCase();

  // Check if role with this rolename already exists (including soft-deleted)
  const existingRole = await Role.findOne({ rolename });
  if (existingRole) {
    if (existingRole.isDeleted) {
      existingRole.isDeleted = false;
      existingRole.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
      if (Array.isArray(data.permissions)) existingRole.permissions = data.permissions;
      if (Array.isArray(data.pages)) existingRole.pages = data.pages;
      if (data.count !== undefined) existingRole.count = Number(data.count);
      await existingRole.save();
      info(`ROLE_RESTORED_AND_UPDATED: ${existingRole.rolename} (${existingRole.id})`);
      return existingRole;
    }
    const error = new Error(`Role "${rolename}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  const roleId = (data.id && data.id.trim()) || (await generateRoleId());

  const role = await Role.create({
    id: roleId,
    rolename,
    permissions: Array.isArray(data.permissions)
      ? data.permissions
      : typeof data.permissions === "string"
      ? data.permissions.split(",").map((p) => p.trim()).filter(Boolean)
      : [],
    pages: Array.isArray(data.pages)
      ? data.pages
      : typeof data.pages === "string"
      ? data.pages.split(",").map((p) => p.trim()).filter(Boolean)
      : [],
    count: data.count !== undefined ? Number(data.count) : 0,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
  });

  info(`ROLE_CREATED: ${role.rolename} (${role.id})`);
  return role;
};

/* ================= GET ALL ROLES (WITH PAGINATION) ================= */
export const getRoles = async (query = {}) => {
  const { isDeleted, isActive, search, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") {
      filter.isDeleted = isDeleted === "true" || isDeleted === true;
    }
  } else {
    filter.isDeleted = false;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    filter.$or = [
      { id: { $regex: search, $options: "i" } },
      { rolename: { $regex: search, $options: "i" } },
    ];
  }

  // Get live counts from User collection (active/non-deleted users)
  const userCounts = await User.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$roleId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(userCounts.map((u) => [String(u._id), u.count]));

  const isPaginated = page !== undefined || limit !== undefined;

  let queryBuilder = Role.find(filter).sort({ createdAt: -1 });

  let currentPage = 1;
  let currentLimit = 10;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;

    total = await Role.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const roles = await queryBuilder.lean();
  const formattedRoles = roles.map((r) => ({
    ...r,
    count: countMap.get(String(r._id)) ?? r.count ?? 0,
  }));

  if (isPaginated) {
    return {
      roles: formattedRoles,
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

  return formattedRoles;
};

/* ================= GET ROLE BY ID / IDENTIFIER ================= */
export const getRoleById = async (identifier) => {
  const role = await Role.findOne(buildRoleQuery(identifier, true));
  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  const count = await User.countDocuments({ roleId: role._id, isDeleted: false });
  const roleObj = role.toObject();
  roleObj.count = count;
  return roleObj;
};

/* ================= UPDATE ROLE ================= */
export const updateRole = async (identifier, data) => {
  const role = await Role.findOne(buildRoleQuery(identifier, true));
  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  const rawName = data.rolename || data.roleName || data.name || data.role;
  if (rawName && rawName.trim()) {
    const rolename = rawName.trim().toLowerCase();
    const exists = await Role.findOne({
      rolename,
      _id: { $ne: role._id },
      isDeleted: false,
    });

    if (exists) {
      const error = new Error("Role with this rolename already exists");
      error.statusCode = 409;
      throw error;
    }
    role.rolename = rolename;
  }

  if (data.id && data.id.trim() !== role.id) {
    const newId = data.id.trim();
    const exists = await Role.findOne({ id: newId, _id: { $ne: role._id } });
    if (exists) {
      const error = new Error(`Role with ID ${newId} already exists`);
      error.statusCode = 409;
      throw error;
    }
    role.id = newId;
  }

  if (Array.isArray(data.permissions)) {
    role.permissions = data.permissions;
  } else if (typeof data.permissions === "string") {
    role.permissions = data.permissions.split(",").map((p) => p.trim()).filter(Boolean);
  }

  if (Array.isArray(data.pages)) {
    role.pages = data.pages;
  } else if (typeof data.pages === "string") {
    role.pages = data.pages.split(",").map((p) => p.trim()).filter(Boolean);
  }

  if (data.count !== undefined) {
    role.count = Math.max(0, Number(data.count) || 0);
  }

  if (data.isActive !== undefined) {
    role.isActive = data.isActive === true || data.isActive === "true";
  }

  if (data.isDeleted !== undefined) {
    role.isDeleted = data.isDeleted === true || data.isDeleted === "true";
  }

  await role.save();
  info(`ROLE_UPDATED: ${role.rolename} (${role.id})`);
  return role;
};

/* ================= DELETE ROLE (SOFT DELETE / HARD DELETE IF ALREADY IN TRASH) ================= */
export const deleteRole = async (identifier) => {
  const role = await Role.findOne(buildRoleQuery(identifier, true));
  if (!role) {
    const error = new Error("Role not found");
    error.statusCode = 404;
    throw error;
  }

  if (role.isDeleted) {
    await Role.deleteOne({ _id: role._id });
    info(`ROLE_PERMANENTLY_DELETED: ${role.rolename} (${role.id})`);
    return { deleted: true, message: `Role ${role.rolename} permanently removed` };
  }

  role.isDeleted = true;
  await role.save();

  info(`ROLE_DELETED: ${role.rolename} (${role.id})`);
  return { deleted: true, message: `Role ${role.rolename} deleted successfully` };
};

/* ================= BULK DELETE ROLES ================= */
export const bulkDeleteRole = async (data) => {
  const ids = Array.isArray(data)
    ? data
    : Array.isArray(data?.ids)
    ? data.ids
    : Array.isArray(data?.roleIds)
    ? data.roleIds
    : [];

  if (!ids || ids.length === 0) {
    const error = new Error("No role IDs provided for bulk delete");
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
  const objectIds = ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  // Find all matching roles
  const roles = await Role.find({
    $or: [
      { _id: { $in: objectIds } },
      { id: { $in: stringIds } },
      { rolename: { $in: stringIds.map((s) => s.toLowerCase()) } },
    ],
  });

  if (!roles || roles.length === 0) {
    const error = new Error("No matching roles found");
    error.statusCode = 404;
    throw error;
  }

  if (data?.permanent === true || data?.force === true) {
    await Role.deleteMany({ _id: { $in: roles.map((r) => r._id) } });
    info(`ROLES_PERMANENTLY_BULK_DELETED: ${roles.length} roles removed`);
    return {
      deleted: true,
      totalCount: roles.length,
      message: `${roles.length} role(s) permanently deleted`,
    };
  }

  const softDeleteIds = [];
  const hardDeleteIds = [];

  for (const role of roles) {
    if (role.isDeleted) {
      hardDeleteIds.push(role._id);
    } else {
      softDeleteIds.push(role._id);
    }
  }

  if (hardDeleteIds.length > 0) {
    await Role.deleteMany({ _id: { $in: hardDeleteIds } });
  }

  if (softDeleteIds.length > 0) {
    await Role.updateMany({ _id: { $in: softDeleteIds } }, { $set: { isDeleted: true } });
  }

  info(
    `ROLES_BULK_DELETED: ${softDeleteIds.length} soft-deleted, ${hardDeleteIds.length} permanently removed`
  );

  return {
    deleted: true,
    totalCount: roles.length,
    softDeletedCount: softDeleteIds.length,
    permanentlyDeletedCount: hardDeleteIds.length,
    message: `${roles.length} role(s) processed (${softDeleteIds.length} moved to trash, ${hardDeleteIds.length} permanently deleted)`,
  };
};

export const bulkDeleteRoles = bulkDeleteRole;
