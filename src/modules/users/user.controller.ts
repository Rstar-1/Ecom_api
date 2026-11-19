import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { UpdateUserBody, UploadedDocuments, UserListQuery } from "./user.types";
import * as service from "./user.service";

/* GET /api/users */
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
    const { id } = getAuthUser(req);
    const data = await service.getUserById(id);
    successResponse(res, data, "Profile fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/users/:id */
export const updateUser: ApiHandler<IdParams, UpdateUserBody> = async (req, res, next) => {
  try {
    const data = await service.updateUser(req.params.id, req.body ?? {});
    successResponse(res, data, "Updated");
  } catch (error) {
    next(error);
  }
};

/* POST /api/users/upload-documents (multipart) */
export const uploadDocuments: ApiHandler = async (req, res, next) => {
  try {
    const { id } = getAuthUser(req);
    const files = req.files as UploadedDocuments | undefined;

    const documents = {
      gstCertificate: files?.gstCertificate?.[0]?.path,
      panCard: files?.panCard?.[0]?.path,
      shopPhoto: files?.shopPhoto?.[0]?.path,
    };

    const data = await service.updateUser(id, { documents });
    successResponse(res, data, "Documents uploaded");
  } catch (error) {
    next(error);
  }
};
