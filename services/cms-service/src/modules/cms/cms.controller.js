import * as service from "./cms.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

// ================= CREATE CMS =================
export const createCms = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.user) {
    body.createdBy = req.user.id || req.user._id;
  }
  const data = await service.createCms(body);
  return successResponse(res, data, "CMS section created", 201);
});

// ================= GET ALL CMS SECTIONS =================
export const getCmsList = asyncHandler(async (req, res) => {
  const data = await service.getCmsList(req.query);
  return successResponse(res, data, "CMS sections fetched");
});

// ================= GET CMS BY SECTION NAME =================
export const getCmsBySectionName = asyncHandler(async (req, res) => {
  const data = await service.getCmsBySectionName(req.params.sectionName);
  return successResponse(res, data, "CMS section fetched");
});

// ================= GET CMS BY ID =================
export const getCmsById = asyncHandler(async (req, res) => {
  const data = await service.getCmsById(req.params.id);
  return successResponse(res, data, "CMS section fetched");
});

// ================= UPDATE CMS SECTION =================
export const updateCms = asyncHandler(async (req, res) => {
  const data = await service.updateCms(req.params.id, req.body);
  return successResponse(res, data, "CMS section updated");
});

// ================= ADD OR UPDATE CMS ITEM =================
export const addOrUpdateCmsItem = asyncHandler(async (req, res) => {
  const data = await service.addOrUpdateCmsItem(req.params.id, req.body);
  return successResponse(res, data, "CMS item saved");
});

// ================= DELETE CMS ITEM =================
export const deleteCmsItem = asyncHandler(async (req, res) => {
  const data = await service.deleteCmsItem(req.params.id, req.params.cmsId);
  return successResponse(res, data, "CMS item removed");
});

// ================= DELETE CMS SECTION =================
export const deleteCms = asyncHandler(async (req, res) => {
  const permanent = req.query.permanent === "true" || req.query.permanent === true;
  const data = await service.deleteCms(req.params.id, permanent);
  return successResponse(res, data, "CMS section deleted");
});

// ================= BULK DELETE CMS =================
export const bulkDeleteCms = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteCms(req.body);
  return successResponse(res, data, "CMS sections deleted successfully");
});

// ================= UPLOAD CMS MEDIA =================
export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("No image file provided");
    error.statusCode = 400;
    throw error;
  }
  const url = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  return successResponse(res, { url, originalName: req.file.originalname }, "File uploaded successfully", 201);
});

