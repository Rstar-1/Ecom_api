import * as service from "./role.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

// ================= CREATE ROLE =================
export const createRole = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.roleName && !body.rolename) body.rolename = body.roleName;
  if (body.name && !body.rolename) body.rolename = body.name;
  const data = await service.createRole(body);

  return successResponse(res, data, "Role created");
});

// ================= GET ALL ROLES =================
export const getRoles = asyncHandler(async (req, res) => {
  const data = await service.getRoles(req.query);

  return successResponse(res, data, "Roles fetched");
});

// ================= BULK DELETE ROLES =================
export const bulkDeleteRole = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteRole(req.body);

  return successResponse(res, data, "Roles deleted successfully");
});

export const bulkDeleteRoles = bulkDeleteRole;

// ================= GET ROLE =================
export const getRoleById = asyncHandler(async (req, res) => {
  const data = await service.getRoleById(req.params.id);

  return successResponse(res, data, "Role fetched");
});

// ================= UPDATE ROLE =================
export const updateRole = asyncHandler(async (req, res) => {
  const data = await service.updateRole(req.params.id, req.body);

  return successResponse(res, data, "Role updated");
});

// ================= DELETE ROLE =================
export const deleteRole = asyncHandler(async (req, res) => {
  const data = await service.deleteRole(req.params.id);

  return successResponse(res, data, "Role deleted");
});
