import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { CategoryBody, CategoryListQuery } from "./category.types";
import * as service from "./category.service";

/* POST /api/categories */
export const createCategory: ApiHandler<EmptyParams, CategoryBody> = async (req, res, next) => {
  try {
    const category = await service.createCategory(req.body ?? {}, getAuthUser(req));
    successResponse(res, category, "Category created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/categories */
export const getCategories: ApiHandler<EmptyParams, never, CategoryListQuery> = async (req, res, next) => {
  try {
    const categories = await service.getCategories(req.query);
    successResponse(res, categories, "Categories fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/categories/:id */
export const getCategoryById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const category = await service.getCategoryById(req.params.id);
    successResponse(res, category, "Category fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/categories/:id */
export const updateCategory: ApiHandler<IdParams, CategoryBody> = async (req, res, next) => {
  try {
    const category = await service.updateCategory(req.params.id, req.body ?? {});
    successResponse(res, category, "Category updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/categories/:id */
export const deleteCategory: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    await service.deleteCategory(req.params.id);
    successResponse(res, null, "Category deleted");
  } catch (error) {
    next(error);
  }
};
