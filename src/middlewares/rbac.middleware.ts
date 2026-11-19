import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HTTP_STATUS, messages, roles } from "../constants";
import { errorResponse } from "../utils/response";

/* ================= PERMISSION BASED ================= */
export const checkPermission =
  (requiredPermission: string): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      if (user.role === roles.ADMIN || requiredPermission === "*") {
        next();
        return;
      }
      if (!Array.isArray(user.permissions)) {
        errorResponse(res, "Permissions not assigned", HTTP_STATUS.FORBIDDEN);
        return;
      }
      if (!user.permissions.includes(requiredPermission)) {
        errorResponse(res, messages.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };

/* ================= ROLE BASED ================= */
export const authorizeRoles =
  (...allowedRoles: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      const allowed = allowedRoles.map((r) => r.toLowerCase());
      if (!allowed.includes(user.role.toLowerCase())) {
        errorResponse(res, messages.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
