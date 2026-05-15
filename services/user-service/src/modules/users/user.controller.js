import * as service from "./user.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

export const getUsers = asyncHandler(async (req, res) => {
  const data = await service.getUsers(req.query);
  return successResponse(res, data, "Users fetched");
});

export const getProfile = asyncHandler(async (req, res) => {
  const data = await service.getUserById(req.user.id);
  return successResponse(res, data, "Profile fetched");
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.body);
  return successResponse(res, data, "Updated");
});

export const uploadDocuments = asyncHandler(async (req, res) => {
  const files = req.files;

  const documents = {
    gstCertificate: files?.gstCertificate?.[0]?.path,
    panCard: files?.panCard?.[0]?.path,
    shopPhoto: files?.shopPhoto?.[0]?.path,
  };

  const data = await service.updateUser(req.user.id, { documents });

  return successResponse(res, data, "Documents uploaded");
});
