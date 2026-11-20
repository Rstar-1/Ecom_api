import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { successResponse } from "../../utils";
import type { RoleBody, RoleListQuery } from "./role.types";
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

/* GET /api/roles?page=&limit=&search=&isActive=&isDeleted= */
export const getRoles: ApiHandler<EmptyParams, never, RoleListQuery> = async (req, res, next) => {
  try {
    const data = await service.getRoles(req.query);
    successResponse(res, data, "Roles fetched");
  } catch (error) {
    next(error);
  }
};

/* GET /api/roles/:id (Mongo _id, ROLE-001 or role name) */
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

/* POST|DELETE /api/roles/bulk-delete { ids, permanent? } */
export const bulkDeleteRoles: ApiHandler<EmptyParams, unknown> = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteRoles(req.body);
    successResponse(res, data, "Roles deleted successfully");
  } catch (error) {
    next(error);
  }
};
