import * as service from "./seo.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

// ================= CREATE SEO =================
export const createSeo = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }
  if (req.user) {
    body.createdBy = req.user.id || req.user._id;
  }
  const data = await service.createSeo(body);
  return successResponse(res, data, "SEO configuration created", 201);
});

// ================= GET ALL SEO CONFIGS =================
export const getSeoList = asyncHandler(async (req, res) => {
  const data = await service.getSeoList(req.query);
  return successResponse(res, data, "SEO configurations fetched");
});

// ================= GET SEO BY PAGE NAME =================
export const getSeoByPage = asyncHandler(async (req, res) => {
  const data = await service.getSeoByPage(req.params.page);
  return successResponse(res, data, "SEO configuration fetched");
});

// ================= GET SEO BY URL PATH =================
export const getSeoByPath = asyncHandler(async (req, res) => {
  const pathStr = req.query.path || req.params.path;
  const data = await service.getSeoByPath(pathStr);
  return successResponse(res, data, "SEO configuration fetched");
});

// ================= GET SEO BY ID =================
export const getSeoById = asyncHandler(async (req, res) => {
  const data = await service.getSeoById(req.params.id);
  return successResponse(res, data, "SEO configuration fetched");
});

// ================= UPDATE SEO CONFIG =================
export const updateSeo = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }
  const data = await service.updateSeo(req.params.id, body);
  return successResponse(res, data, "SEO configuration updated");
});

// ================= DELETE SEO CONFIG =================
export const deleteSeo = asyncHandler(async (req, res) => {
  const permanent = req.query.permanent === "true" || req.query.permanent === true;
  const data = await service.deleteSeo(req.params.id, permanent);
  return successResponse(res, data, "SEO configuration deleted");
});

// ================= BULK DELETE SEO CONFIGS =================
export const bulkDeleteSeo = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteSeo(req.body);
  return successResponse(res, data, "SEO configurations deleted successfully");
});

// ================= SEED INITIAL SEO DATA =================
export const seedSeo = asyncHandler(async (req, res) => {
  const force = req.query.force === "true" || req.body?.force === true;
  const data = await service.seedInitialSeo(force);
  return successResponse(res, data, "SEO seed executed", 200);
});

// ================= UPLOAD OG IMAGE =================
export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    const error = new Error("No image file provided");
    error.statusCode = 400;
    throw error;
  }
  const url = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  return successResponse(res, { url, originalName: req.file.originalname }, "Image uploaded successfully", 201);
});

