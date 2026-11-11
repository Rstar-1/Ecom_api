import * as service from "./auth.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

export const register = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.files?.image?.[0]) {
    body.image = req.files.image[0].filename
      ? `/uploads/${req.files.image[0].filename}`
      : req.files.image[0].path;
  }

  const documents = {};
  if (req.files?.gstCertificate?.[0]) {
    documents.gstCertificate = req.files.gstCertificate[0].filename
      ? `/uploads/${req.files.gstCertificate[0].filename}`
      : req.files.gstCertificate[0].path;
  }
  if (req.files?.panCard?.[0]) {
    documents.panCard = req.files.panCard[0].filename
      ? `/uploads/${req.files.panCard[0].filename}`
      : req.files.panCard[0].path;
  }
  if (req.files?.shopPhoto?.[0]) {
    documents.shopPhoto = req.files.shopPhoto[0].filename
      ? `/uploads/${req.files.shopPhoto[0].filename}`
      : req.files.shopPhoto[0].path;
  }
  if (Object.keys(documents).length > 0) {
    body.documents = documents;
  }

  const data = await service.registerUser(body);
  return successResponse(res, data, "OTP sent");
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const data = await service.verifyRegisterOtp(req.body);
  return successResponse(res, data, "Verified");
});

export const login = asyncHandler(async (req, res) => {
  const data = await service.loginUser(req.body);
  return successResponse(res, data, "Login successful");
});

export const logout = asyncHandler(async (req, res) => {
  const data = await service.logoutUser(req.user);
  return successResponse(res, data, "Logout successful");
});
