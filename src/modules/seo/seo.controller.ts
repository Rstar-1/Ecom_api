import { HTTP_STATUS } from "../../constants";
import { fileUrl } from "../../middlewares";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { AppError, getAuthUser, successResponse, toBool } from "../../utils";
import type {
  SeoBody,
  SeoDeleteQuery,
  SeoListQuery,
  SeoPageParams,
  SeoPathQuery,
} from "./seo.types";
import * as service from "./seo.service";

const withImage = (body: SeoBody | undefined, file: Express.Multer.File | undefined): SeoBody => {
  const image = fileUrl(file);
  return { ...(body ?? {}), ...(image ? { image } : {}) };
};

/* POST /api/seo (JSON or multipart with `image`) */
export const createSeo: ApiHandler<EmptyParams, SeoBody> = async (req, res, next) => {
  try {
    const authId = getAuthUser(req).id;
    const creator =
      (await service.resolveUserObjectId(req.body?.createdBy || (req.body as any)?.userId)) ||
      (await service.resolveUserObjectId(authId)) ||
      authId;
    const data = await service.createSeo(withImage(req.body, req.file), creator);
    successResponse(res, data, "SEO configuration created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/seo?page=&limit=&search=&type= */
export const getSeoList: ApiHandler<EmptyParams, never, SeoListQuery> = async (req, res, next) => {
  try {
    const data = await service.getSeoList(req.query);
    successResponse(res, data, "SEO configurations fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/seo/page/:page */
export const getSeoByPage: ApiHandler<SeoPageParams> = async (req, res, next) => {
  try {
    const data = await service.getSeoByPage(req.params.page);
    successResponse(res, data, "SEO configuration fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/seo/by-path?path=/about */
export const getSeoByPath: ApiHandler<EmptyParams, never, SeoPathQuery> = async (req, res, next) => {
  try {
    const data = await service.getSeoByPath(req.query.path);
    successResponse(res, data, "SEO configuration fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/seo/:id */
export const getSeoById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getSeoById(req.params.id);
    successResponse(res, data, "SEO configuration fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/seo/:id */
export const updateSeo: ApiHandler<IdParams, SeoBody> = async (req, res, next) => {
  try {
    const data = await service.updateSeo(req.params.id, withImage(req.body, req.file));
    successResponse(res, data, "SEO configuration updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/seo/:id?permanent=true */
export const deleteSeo: ApiHandler<IdParams, never, SeoDeleteQuery> = async (req, res, next) => {
  try {
    const data = await service.deleteSeo(req.params.id, toBool(req.query.permanent));
    successResponse(res, data, "SEO configuration deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/seo/bulk-delete { ids, permanent? } */
export const bulkDeleteSeo: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteSeo(req.body);
    successResponse(res, data, "SEO configurations deleted successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/seo/upload (multipart `image`) -> { url } */
export const uploadImage: ApiHandler = async (req, res, next) => {
  try {
    const url = fileUrl(req.file);
    if (!url || !req.file) throw AppError.badRequest("No image file provided");
    successResponse(res, { url, originalName: req.file.originalname }, "Image uploaded successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};
