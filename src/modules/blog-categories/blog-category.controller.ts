import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { BlogCategoryBody, BlogCategoryListQuery } from "./blogCategory.types";
import * as service from "./blog-category.service";

/* POST /api/blog-categories */
export const createBlogCategory: ApiHandler<EmptyParams, BlogCategoryBody> = async (req, res, next) => {
  try {
    const data = await service.createBlogCategory(req.body ?? {}, getAuthUser(req).id);
    successResponse(res, data, "Blog Category created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/blog-categories */
export const getBlogCategories: ApiHandler<EmptyParams, never, BlogCategoryListQuery> = async (req, res, next) => {
  try {
    const data = await service.getBlogCategories(req.query);
    successResponse(res, data, "Blog Categories fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/blog-categories/:id */
export const getBlogCategoryById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getBlogCategoryById(req.params.id);
    successResponse(res, data, "Blog Category fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/blog-categories/:id */
export const updateBlogCategory: ApiHandler<IdParams, BlogCategoryBody> = async (req, res, next) => {
  try {
    const data = await service.updateBlogCategory(req.params.id, req.body ?? {});
    successResponse(res, data, "Blog Category updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/blog-categories/:id */
export const deleteBlogCategory: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.deleteBlogCategory(req.params.id);
    successResponse(res, data, "Blog Category deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/blog-categories/bulk-delete */
export const bulkDeleteBlogCategories: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteBlogCategories(req.body);
    successResponse(res, data, "Blog Categories deleted successfully");
  } catch (error) {
    next(error);
  }
};
