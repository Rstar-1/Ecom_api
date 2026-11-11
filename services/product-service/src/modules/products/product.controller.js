import * as service from "./product.service.js";
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

// ================= CREATE PRODUCT =================
export const createProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.files?.image?.[0]) {
    body.image = req.files.image[0].filename
      ? `/uploads/${req.files.image[0].filename}`
      : req.files.image[0].path;
  }
  if (req.files?.images?.length) {
    body.images = req.files.images.map((f) =>
      f.filename ? `/uploads/${f.filename}` : f.path
    );
  }
  const creator = resolveReqCreator(req);
  if (creator) {
    body.createdBy = creator;
  }

  const data = await service.createProduct(body);
  return successResponse(res, data, "Product created");
});

// ================= GET ALL PRODUCTS =================
export const getProducts = asyncHandler(async (req, res) => {
  const data = await service.getProducts(req.query);
  return successResponse(res, data, "Products fetched");
});

// ================= GET PRODUCT BY ID =================
export const getProductById = asyncHandler(async (req, res) => {
  const data = await service.getProductById(req.params.id);
  return successResponse(res, data, "Product fetched");
});

// ================= UPDATE PRODUCT =================
export const updateProduct = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.files?.image?.[0]) {
    body.image = req.files.image[0].filename
      ? `/uploads/${req.files.image[0].filename}`
      : req.files.image[0].path;
  }
  if (req.files?.images?.length) {
    body.images = req.files.images.map((f) =>
      f.filename ? `/uploads/${f.filename}` : f.path
    );
  }

  const data = await service.updateProduct(req.params.id, body);
  return successResponse(res, data, "Product updated");
});

// ================= DELETE PRODUCT =================
export const deleteProduct = asyncHandler(async (req, res) => {
  const data = await service.deleteProduct(req.params.id);
  return successResponse(res, data, "Product deleted");
});

// ================= BULK DELETE PRODUCTS =================
export const bulkDeleteProduct = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteProduct(req.body);
  return successResponse(res, data, "Products deleted successfully");
});

export const bulkDeleteProducts = bulkDeleteProduct;

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
