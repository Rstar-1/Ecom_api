import * as service from "./role.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

// ================= CREATE ROLE =================
export const createRole = asyncHandler(async (req, res) => {
  const data = await service.createRole(req.body);

  return successResponse(res, data, "Role created");
});

// ================= GET ALL ROLES =================
export const getRoles = asyncHandler(async (req, res) => {
  const data = await service.getRoles();

  return successResponse(res, data, "Roles fetched");
});

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
