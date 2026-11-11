import * as service from "./user.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

export const getUsers = asyncHandler(async (req, res) => {
  const data = await service.getUsers(req.query);
  return successResponse(res, data, "Users fetched");
});

export const getUserById = asyncHandler(async (req, res) => {
  const data = await service.getUserById(req.params.id);
  return successResponse(res, data, "User fetched");
});

export const getProfile = asyncHandler(async (req, res) => {
  const identifier = req.user.id || req.user._id;
  const data = await service.getUserById(identifier);
  return successResponse(res, data, "Profile fetched");
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.body);
  return successResponse(res, data, "User updated");
});

export const deleteUser = asyncHandler(async (req, res) => {
  const data = await service.deleteUser(req.params.id);
  return successResponse(res, data, "User deleted");
});

export const bulkDeleteUser = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteUser(req.body);
  return successResponse(res, data, "Users deleted successfully");
});

export const bulkDeleteUsers = bulkDeleteUser;

export const uploadDocuments = asyncHandler(async (req, res) => {
  const files = req.files;

  const documents = {
    gstCertificate: files?.gstCertificate?.[0]
      ? (files.gstCertificate[0].filename ? `/uploads/${files.gstCertificate[0].filename}` : files.gstCertificate[0].path)
      : undefined,
    panCard: files?.panCard?.[0]
      ? (files.panCard[0].filename ? `/uploads/${files.panCard[0].filename}` : files.panCard[0].path)
      : undefined,
    shopPhoto: files?.shopPhoto?.[0]
      ? (files.shopPhoto[0].filename ? `/uploads/${files.shopPhoto[0].filename}` : files.shopPhoto[0].path)
      : undefined,
  };

  const identifier = req.user.id || req.user._id;
  const data = await service.updateUser(identifier, { documents });

  return successResponse(res, data, "Documents uploaded");
});
