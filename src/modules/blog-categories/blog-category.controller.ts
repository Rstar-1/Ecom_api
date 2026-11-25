import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse, toBool } from "../../utils";
import { resolveUserObjectId } from "../roles/role.helpers";
import type { BlogCategoryBody, BlogCategoryListQuery } from "./blogCategory.types";
import * as service from "./blog-category.service";

/* POST /api/blog-categories */
export const createBlogCategory: ApiHandler<EmptyParams, BlogCategoryBody> = async (req, res, next) => {
  try {
    const authId = getAuthUser(req).id;
    const creator = (await resolveUserObjectId(req.body?.createdBy)) || (await resolveUserObjectId(authId)) || authId;
    const data = await service.createBlogCategory(req.body ?? {}, creator);
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
    const permanent = toBool(req.query?.permanent) || toBool((req.body as any)?.permanent);
    const data = await service.deleteBlogCategory(req.params.id, permanent);
    successResponse(res, data, permanent ? "Blog Category permanently deleted" : "Blog Category deleted");
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
