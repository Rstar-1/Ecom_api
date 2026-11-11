import * as service from "./category.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse, jwt } = utils;

const resolveReqCreator = (req) => {
  if (req.body?.createdBy) return req.body.createdBy;
  if (req.user) return req.user.id || req.user._id || req.user.userId;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt?.verifyToken
        ? jwt.verifyToken(token, process.env.JWT_SECRET)
        : null;
      if (decoded) {
        return decoded.id || decoded.userId || decoded._id || decoded.email;
      }
    } catch {}
  }
  return null;
};

// ================= CREATE CATEGORY =================
export const createCategory = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }
  const creator = resolveReqCreator(req);
  if (creator) {
    body.createdBy = creator;
  }

  const data = await service.createCategory(body);
  return successResponse(res, data, "Category created");
});

// ================= GET ALL CATEGORIES =================
export const getCategories = asyncHandler(async (req, res) => {
  const data = await service.getCategories(req.query);
  return successResponse(res, data, "Categories fetched");
});

// ================= GET CATEGORY BY ID =================
export const getCategoryById = asyncHandler(async (req, res) => {
  const data = await service.getCategoryById(req.params.id);
  return successResponse(res, data, "Category fetched");
});

// ================= UPDATE CATEGORY =================
export const updateCategory = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }

  const data = await service.updateCategory(req.params.id, body);
  return successResponse(res, data, "Category updated");
});

// ================= DELETE CATEGORY =================
export const deleteCategory = asyncHandler(async (req, res) => {
  const data = await service.deleteCategory(req.params.id);
  return successResponse(res, data, "Category deleted");
});

// ================= BULK DELETE CATEGORIES =================
export const bulkDeleteCategory = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteCategory(req.body);
  return successResponse(res, data, "Categories deleted successfully");
});

export const bulkDeleteCategories = bulkDeleteCategory;
