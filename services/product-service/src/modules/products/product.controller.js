import * as service from "./product.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

export const createProduct = asyncHandler(async (req, res) => {
  // Ensure the user is a vendor
  if (req.user.role !== "vendor") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Only vendors can create products.",
    });
  }

  // Inject vendorId and vendorEmail from authenticated user
  const data = { 
    ...req.body, 
    vendorId: req.user.id,
    vendorEmail: req.user.email 
  };
  const product = await service.createProduct(data);
  return successResponse(res, product, "Product created", 201);
});

export const getProducts = asyncHandler(async (req, res) => {
  const products = await service.getProducts(req.query);
  return successResponse(res, products, "Products fetched");
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await service.getProductById(req.params.id);
  return successResponse(res, product, "Product fetched");
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await service.updateProduct(req.params.id, req.body);
  return successResponse(res, product, "Product updated");
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await service.deleteProduct(req.params.id);
  return successResponse(res, null, "Product deleted");
});
