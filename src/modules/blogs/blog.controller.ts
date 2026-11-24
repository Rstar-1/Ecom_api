import { HTTP_STATUS } from "../../constants";
import { fileUrl } from "../../middlewares";
import type { ReviewInput } from "../products/product.model";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import { resolveUserObjectId } from "../roles/role.helpers";
import type { ReviewParams } from "../products/product.types";
import type { BlogBody, BlogListQuery } from "./blog.types";
import * as service from "./blog.service";

const withImage = (body: BlogBody | undefined, file: Express.Multer.File | undefined): BlogBody => {
  const image = fileUrl(file);
  return { ...(body ?? {}), ...(image ? { image } : {}) };
};

/* POST /api/blogs (JSON or multipart with `image`) */
export const createBlog: ApiHandler<EmptyParams, BlogBody> = async (req, res, next) => {
  try {
    const body = withImage(req.body, req.file);
    const authId = getAuthUser(req).id;
    const creator = (await resolveUserObjectId(body.createdBy)) || (await resolveUserObjectId(authId)) || authId;
    const data = await service.createBlog(body, creator);
    successResponse(res, data, "Blog created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/blogs?page=&limit=&search=&categoryId=&isActive=&isDeleted= */
export const getBlogs: ApiHandler<EmptyParams, never, BlogListQuery> = async (req, res, next) => {
  try {
    const data = await service.getBlogs(req.query);
    successResponse(res, data, "Blogs fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/blogs/:id */
export const getBlogById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getBlogById(req.params.id);
    successResponse(res, data, "Blog fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/blogs/:id */
export const updateBlog: ApiHandler<IdParams, BlogBody> = async (req, res, next) => {
  try {
    const data = await service.updateBlog(req.params.id, withImage(req.body, req.file));
    successResponse(res, data, "Blog updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/blogs/:id */
export const deleteBlog: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.deleteBlog(req.params.id);
    successResponse(res, data, "Blog deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/blogs/bulk-delete { ids, permanent? } */
export const bulkDeleteBlogs: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteBlogs(req.body);
    successResponse(res, data, "Blogs deleted successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/blogs/:id/reviews { rating, comment } */
export const addReview: ApiHandler<IdParams, ReviewInput> = async (req, res, next) => {
  try {
    const data = await service.addReview(req.params.id, req.body ?? {}, getAuthUser(req).id);
    successResponse(res, data, "Review added successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/blogs/:id/reviews/:reviewId */
export const deleteReview: ApiHandler<ReviewParams> = async (req, res, next) => {
  try {
    const data = await service.deleteReview(req.params.id, req.params.reviewId);
    successResponse(res, data, "Review deleted successfully");
  } catch (error) {
    next(error);
  }
};
