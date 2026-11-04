import { utils, models } from "../../../../../shared/index.js";

const { info, generateRoleId, buildRoleQuery } = utils;
const { Role } = models;

/* ================= CREATE ROLE ================= */
export const createRole = async (data) => {
  if (!data.rolename) {
    throw new Error("Role name is required");
  }

  const rolename = data.rolename.trim().toLowerCase();

  const exists = await Role.findOne({ rolename, isDeleted: false });
  if (exists) {
    throw new Error("Role already exists");
  }

  const id = data.id?.trim() || (await generateRoleId());

  const existingId = await Role.findOne({ id });
  if (existingId) {
    throw new Error(`Role with ID ${id} already exists`);
  }

  const role = await Role.create({
    id,
    rolename,
    permissions: Array.isArray(data.permissions) ? data.permissions : [],
    pages: Array.isArray(data.pages) ? data.pages : [],
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
  });

  info(`ROLE_CREATED: ${role.rolename} (${role.id})`);
  return role;
};

/* ================= GET ALL ROLES ================= */
export const getRoles = async (query = {}) => {
  const filter = { isDeleted: false };
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === "true" || query.isActive === true;
  }

  return Role.find(filter).sort({ createdAt: -1 }).lean();
};

/* ================= GET ROLE BY ID / IDENTIFIER ================= */
export const getRoleById = async (identifier) => {
  const role = await Role.findOne(buildRoleQuery(identifier));
  if (!role) {
    throw new Error("Role not found");
  }
  return role;
};

/* ================= UPDATE ROLE ================= */
export const updateRole = async (identifier, data) => {
  const role = await Role.findOne(buildRoleQuery(identifier));
  if (!role) {
    throw new Error("Role not found");
  }

  if (data.rolename) {
    const rolename = data.rolename.trim().toLowerCase();
    const exists = await Role.findOne({
      rolename,
      _id: { $ne: role._id },
      isDeleted: false,
    });

    if (exists) {
      throw new Error("Role with this rolename already exists");
    }
    role.rolename = rolename;
  }

  if (data.id && data.id.trim() !== role.id) {
    const newId = data.id.trim();
    const exists = await Role.findOne({ id: newId, _id: { $ne: role._id } });
    if (exists) {
      throw new Error(`Role with ID ${newId} already exists`);
    }
    role.id = newId;
  }

  if (Array.isArray(data.permissions)) role.permissions = data.permissions;
  if (Array.isArray(data.pages)) role.pages = data.pages;
  if (data.isActive !== undefined) role.isActive = Boolean(data.isActive);
  if (data.isDeleted !== undefined) role.isDeleted = Boolean(data.isDeleted);

  await role.save();
  info(`ROLE_UPDATED: ${role.rolename} (${role.id})`);
  return role;
};

/* ================= DELETE ROLE (SOFT DELETE) ================= */
export const deleteRole = async (identifier) => {
  const role = await Role.findOne(buildRoleQuery(identifier));
  if (!role) {
    throw new Error("Role not found");
  }

  role.isDeleted = true;
  await role.save();

  info(`ROLE_DELETED: ${role.rolename} (${role.id})`);
  return { deleted: true, message: `Role ${role.rolename} deleted successfully` };
};
