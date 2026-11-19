import { Role } from "../../models";
import { AppError, logger } from "../../utils";
import type { RoleBody } from "./role.types";

const normalizeName = (name: string): string => name.trim().toLowerCase();

export const createRole = async (data: RoleBody) => {
  if (!data.name?.trim()) throw AppError.badRequest("Role name is required");

  const name = normalizeName(data.name);
  if (await Role.exists({ name })) throw AppError.conflict("Role already exists");

  const role = await Role.create({
    name,
    permissions: data.permissions ?? [],
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
  });
  logger.info(`ROLE_CREATED: ${role.name}`);
  return role;
};

export const getRoles = () => Role.find({ isDeleted: false }).sort({ createdAt: -1 }).lean();

export const getRoleById = async (id: string) => {
  const role = await Role.findOne({ _id: id, isDeleted: false });
  if (!role) throw AppError.notFound("Role not found");
  return role;
};

export const updateRole = async (id: string, data: RoleBody) => {
  const role = await getRoleById(id);

  if (data.name) {
    const name = normalizeName(data.name);
    if (await Role.exists({ name, _id: { $ne: id } })) throw AppError.conflict("Role already exists");
    role.name = name;
  }
  if (data.permissions) role.set("permissions", data.permissions);
  if (data.isActive !== undefined) role.isActive = data.isActive;

  await role.save();
  logger.info(`ROLE_UPDATED: ${role.name}`);
  return role;
};

export const deleteRole = async (id: string): Promise<{ deleted: true }> => {
  const role = await getRoleById(id);
  role.isDeleted = true;
  await role.save();
  logger.info(`ROLE_DELETED: ${role.name}`);
  return { deleted: true };
};
