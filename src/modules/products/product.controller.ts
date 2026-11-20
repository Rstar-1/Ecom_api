import { HTTP_STATUS } from "../../constants";
import { fileUrl } from "../../middlewares";
import type { ReviewInput } from "../../models";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { ProductBody, ProductFiles, ProductListQuery, ReviewParams } from "./product.types";
import * as service from "./product.service";

/** Adds uploaded `image` / `images` files to the body as /uploads/... paths. */
const withFiles = (body: ProductBody | undefined, files: ProductFiles | undefined): ProductBody => {
  const result: ProductBody = { ...(body ?? {}) };
  const image = fileUrl(files?.image?.[0]);
  if (image) result.image = image;
  const images = (files?.images ?? []).map(fileUrl).filter((u): u is string => !!u);
  if (images.length) result.images = images;
  return result;
};

/* POST /api/products (JSON or multipart with image / images[]) */
export const createProduct: ApiHandler<EmptyParams, ProductBody> = async (req, res, next) => {
  try {
    const body = withFiles(req.body, req.files as ProductFiles | undefined);
    const data = await service.createProduct(body, getAuthUser(req).id);
    successResponse(res, data, "Product created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/products?page=&limit=&search=&categoryId=&severity=&isTrending=&stockStatus= */
export const getProducts: ApiHandler<EmptyParams, never, ProductListQuery> = async (req, res, next) => {
  try {
    const data = await service.getProducts(req.query);
    successResponse(res, data, "Products fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/products/:id */
export const getProductById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getProductById(req.params.id);
    successResponse(res, data, "Product fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/products/:id */
export const updateProduct: ApiHandler<IdParams, ProductBody> = async (req, res, next) => {
  try {
    const body = withFiles(req.body, req.files as ProductFiles | undefined);
    const data = await service.updateProduct(req.params.id, body);
    successResponse(res, data, "Product updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/products/:id */
export const deleteProduct: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.deleteProduct(req.params.id);
    successResponse(res, data, "Product deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/products/bulk-delete { ids, permanent? } */
export const bulkDeleteProducts: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteProducts(req.body);
    successResponse(res, data, "Products deleted successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/products/:id/reviews { rating, comment } */
export const addReview: ApiHandler<IdParams, ReviewInput> = async (req, res, next) => {
  try {
    const data = await service.addReview(req.params.id, req.body ?? {}, getAuthUser(req).id);
    successResponse(res, data, "Review added successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/products/:id/reviews/:reviewId */
export const deleteReview: ApiHandler<ReviewParams> = async (req, res, next) => {
  try {
    const data = await service.deleteReview(req.params.id, req.params.reviewId);
    successResponse(res, data, "Review deleted successfully");
  } catch (error) {
    next(error);
  }
};
