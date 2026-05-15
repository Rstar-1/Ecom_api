import { utils, models } from "../../../../../shared/index.js";

const { info } = utils;
const { Role } = models;

/* ================= NORMALIZE ROLE NAME ================= */
const normalizeName = (name) => {
  return name.trim().toLowerCase();
};

/* ================= CREATE ROLE ================= */
export const createRole = async (data) => {
  if (!data.name) {
    throw new Error("Role name is required");
  }

  const name = normalizeName(data.name);

  const exists = await Role.findOne({ name });

  if (exists) {
    throw new Error("Role already exists");
  }

  const role = await Role.create({
    ...data,
    name,
  });

  info(`ROLE_CREATED: ${role.name}`);

  return role;
};

/* ================= GET ALL ROLES ================= */
export const getRoles = async () => {
  return await Role.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .lean();
};

/* ================= GET ROLE BY ID ================= */
export const getRoleById = async (id) => {
  const role = await Role.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
};

/* ================= UPDATE ROLE ================= */
export const updateRole = async (id, data) => {
  const role = await Role.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!role) {
    throw new Error("Role not found");
  }

  /* 🔥 Prevent name duplication */
  if (data.name) {
    const name = normalizeName(data.name);

    const exists = await Role.findOne({
      name,
      _id: { $ne: id },
    });

    if (exists) {
      throw new Error("Role already exists");
    }

    role.name = name;
  }

  /* Optional: update permissions if you have */
  if (data.permissions) {
    role.permissions = data.permissions;
  }

  await role.save();

  info(`ROLE_UPDATED: ${role.name}`);

  return role;
};

/* ================= DELETE ROLE (SOFT DELETE) ================= */
export const deleteRole = async (id) => {
  const role = await Role.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!role) {
    throw new Error("Role not found");
  }

  role.isDeleted = true;
  await role.save();

  info(`ROLE_DELETED: ${role.name}`);

  return { deleted: true };
};
