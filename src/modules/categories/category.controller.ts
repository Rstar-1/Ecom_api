import { HTTP_STATUS } from "../../constants";
import { fileUrl } from "../../middlewares";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import { resolveUserObjectId } from "../roles/role.helpers";
import type { CategoryBody, CategoryListQuery } from "./category.types";
import * as service from "./category.service";

const withImage = (body: CategoryBody | undefined, file: Express.Multer.File | undefined): CategoryBody => {
  const image = fileUrl(file);
  return { ...(body ?? {}), ...(image ? { image } : {}) };
};

/* POST /api/categories (JSON or multipart with `image`) */
export const createCategory: ApiHandler<EmptyParams, CategoryBody> = async (req, res, next) => {
  try {
    const body = withImage(req.body, req.file);
    const authId = getAuthUser(req).id;
    const creator = (await resolveUserObjectId(body.createdBy)) || (await resolveUserObjectId(authId)) || authId;
    const data = await service.createCategory(body, creator);
    successResponse(res, data, "Category created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/categories?page=&limit=&search=&isActive=&isDeleted= */
export const getCategories: ApiHandler<EmptyParams, never, CategoryListQuery> = async (req, res, next) => {
  try {
    const data = await service.getCategories(req.query);
    successResponse(res, data, "Categories fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/categories/:id */
export const getCategoryById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getCategoryById(req.params.id);
    successResponse(res, data, "Category fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/categories/:id */
export const updateCategory: ApiHandler<IdParams, CategoryBody> = async (req, res, next) => {
  try {
    const data = await service.updateCategory(req.params.id, withImage(req.body, req.file));
    successResponse(res, data, "Category updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/categories/:id */
export const deleteCategory: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.deleteCategory(req.params.id);
    successResponse(res, data, "Category deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/categories/bulk-delete { ids, permanent? } */
export const bulkDeleteCategories: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteCategories(req.body);
    successResponse(res, data, "Categories deleted successfully");
  } catch (error) {
    next(error);
  }
};
