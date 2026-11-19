import { HTTP_STATUS, roles } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { AppError, getAuthUser, successResponse } from "../../utils";
import type { ProductBody, ProductListQuery } from "./product.types";
import * as service from "./product.service";

/* POST /api/products (vendors only) */
export const createProduct: ApiHandler<EmptyParams, ProductBody> = async (req, res, next) => {
  try {
    const user = getAuthUser(req);
    if (user.role !== roles.VENDOR) {
      throw AppError.forbidden("Access denied. Only vendors can create products.");
    }
    const product = await service.createProduct(req.body ?? {}, user);
    successResponse(res, product, "Product created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/products */
export const getProducts: ApiHandler<EmptyParams, never, ProductListQuery> = async (req, res, next) => {
  try {
    const products = await service.getProducts(req.query);
    successResponse(res, products, "Products fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/products/:id */
export const getProductById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const product = await service.getProductById(req.params.id);
    successResponse(res, product, "Product fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/products/:id */
export const updateProduct: ApiHandler<IdParams, ProductBody> = async (req, res, next) => {
  try {
    const product = await service.updateProduct(req.params.id, req.body ?? {});
    successResponse(res, product, "Product updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/products/:id */
export const deleteProduct: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    await service.deleteProduct(req.params.id);
    successResponse(res, null, "Product deleted");
  } catch (error) {
    next(error);
  }
};
