import { fileUrl } from "../../middlewares";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { UpdateUserBody, UploadedDocuments, UserListQuery } from "./user.types";
import * as service from "./user.service";

/* GET /api/users?page=&limit=&search=&role=&isActive=&isDeleted= */
export const getUsers: ApiHandler<EmptyParams, never, UserListQuery> = async (req, res, next) => {
  try {
    const data = await service.getUsers(req.query);
    successResponse(res, data, "Users fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/users/profile */
export const getProfile: ApiHandler = async (req, res, next) => {
  try {
    const data = await service.getUserById(getAuthUser(req).id);
    successResponse(res, data, "Profile fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/users/:id */
export const getUserById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getUserById(req.params.id);
    successResponse(res, data, "User fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/users/:id */
export const updateUser: ApiHandler<IdParams, UpdateUserBody> = async (req, res, next) => {
  try {
    const data = await service.updateUser(req.params.id, req.body ?? {});
    successResponse(res, data, "User updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/users/:id */
export const deleteUser: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.deleteUser(req.params.id);
    successResponse(res, data, "User deleted");
  } catch (error) {
    next(error);
  }
};

/* POST|DELETE /api/users/bulk-delete { ids, permanent? } */
export const bulkDeleteUsers: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteUsers(req.body);
    successResponse(res, data, "Users deleted successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/users/upload-documents (multipart: gstCertificate, panCard, shopPhoto) */
export const uploadDocuments: ApiHandler = async (req, res, next) => {
  try {
    const files = req.files as UploadedDocuments | undefined;
    const documents = {
      gstCertificate: fileUrl(files?.gstCertificate?.[0]),
      panCard: fileUrl(files?.panCard?.[0]),
      shopPhoto: fileUrl(files?.shopPhoto?.[0]),
    };
    const data = await service.updateUser(getAuthUser(req).id, { documents });
    successResponse(res, data, "Documents uploaded");
  } catch (error) {
    next(error);
  }
};
