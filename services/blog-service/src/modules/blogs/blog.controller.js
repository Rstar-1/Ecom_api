import * as service from "./blog.service.js";
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

// ================= CREATE BLOG =================
export const createBlog = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }
  const creator = resolveReqCreator(req);
  if (creator) {
    body.createdBy = creator;
  }

  const data = await service.createBlog(body);
  return successResponse(res, data, "Blog created");
});

// ================= GET ALL BLOGS =================
export const getBlogs = asyncHandler(async (req, res) => {
  const data = await service.getBlogs(req.query);
  return successResponse(res, data, "Blogs fetched");
});

// ================= GET BLOG BY ID =================
export const getBlogById = asyncHandler(async (req, res) => {
  const data = await service.getBlogById(req.params.id);
  return successResponse(res, data, "Blog fetched");
});

// ================= UPDATE BLOG =================
export const updateBlog = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.file) {
    body.image = req.file.filename ? `/uploads/${req.file.filename}` : req.file.path;
  }

  const data = await service.updateBlog(req.params.id, body);
  return successResponse(res, data, "Blog updated");
});

// ================= DELETE BLOG =================
export const deleteBlog = asyncHandler(async (req, res) => {
  const data = await service.deleteBlog(req.params.id);
  return successResponse(res, data, "Blog deleted");
});

// ================= BULK DELETE BLOGS =================
export const bulkDeleteBlog = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteBlog(req.body);
  return successResponse(res, data, "Blogs deleted successfully");
});

export const bulkDeleteBlogs = bulkDeleteBlog;

// ================= ADD REVIEW =================
export const addReview = asyncHandler(async (req, res) => {
  const reviewBody = { ...req.body };
  const creator = resolveReqCreator(req);
  if (creator) {
    reviewBody.createdBy = creator;
  }
  const data = await service.addReview(req.params.id, reviewBody);
  return successResponse(res, data, "Review added successfully");
});

// ================= DELETE REVIEW =================
export const deleteReview = asyncHandler(async (req, res) => {
  const data = await service.deleteReview(req.params.id, req.params.reviewId);
  return successResponse(res, data, "Review deleted successfully");
});

