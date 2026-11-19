import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { successResponse } from "../../utils";
import type { RoleBody } from "./role.types";
import * as service from "./role.service";

/* POST /api/roles */
export const createRole: ApiHandler<EmptyParams, RoleBody> = async (req, res, next) => {
  try {
    const data = await service.createRole(req.body ?? {});
    successResponse(res, data, "Role created", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/roles */
export const getRoles: ApiHandler = async (_req, res, next) => {
  try {
    const data = await service.getRoles();
    successResponse(res, data, "Roles fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/roles/:id */
export const getRoleById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getRoleById(req.params.id);
    successResponse(res, data, "Role fetched");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/roles/:id */
export const updateRole: ApiHandler<IdParams, RoleBody> = async (req, res, next) => {
  try {
    const data = await service.updateRole(req.params.id, req.body ?? {});
    successResponse(res, data, "Role updated");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/roles/:id */
export const deleteRole: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.deleteRole(req.params.id);
    successResponse(res, data, "Role deleted");
  } catch (error) {
    next(error);
  }
};
