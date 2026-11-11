import * as service from "./blogCategory.service.js";
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

// ================= CREATE BLOG CATEGORY =================
export const createBlogCategory = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.name && !body.categoryName) {
    body.categoryName = body.name;
  }
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }
  const creator = resolveReqCreator(req);
  if (creator) {
    body.createdBy = creator;
  }

  const data = await service.createBlogCategory(body);
  return successResponse(res, data, "Blog Category created");
});

// ================= GET ALL BLOG CATEGORIES =================
export const getBlogCategories = asyncHandler(async (req, res) => {
  const data = await service.getBlogCategories(req.query);
  return successResponse(res, data, "Blog Categories fetched");
});

// ================= GET BLOG CATEGORY BY ID =================
export const getBlogCategoryById = asyncHandler(async (req, res) => {
  const data = await service.getBlogCategoryById(req.params.id);
  return successResponse(res, data, "Blog Category fetched");
});

// ================= UPDATE BLOG CATEGORY =================
export const updateBlogCategory = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (body.name && !body.categoryName) {
    body.categoryName = body.name;
  }
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }

  const data = await service.updateBlogCategory(req.params.id, body);
  return successResponse(res, data, "Blog Category updated");
});

// ================= DELETE BLOG CATEGORY =================
export const deleteBlogCategory = asyncHandler(async (req, res) => {
  const data = await service.deleteBlogCategory(req.params.id);
  return successResponse(res, data, "Blog Category deleted");
});

// ================= BULK DELETE BLOG CATEGORIES =================
export const bulkDeleteBlogCategory = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteBlogCategory(req.body);
  return successResponse(res, data, "Blog Categories deleted successfully");
});

export const bulkDeleteBlogCategories = bulkDeleteBlogCategory;
