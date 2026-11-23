import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HTTP_STATUS, messages } from "../constants";
import type { AuthUser } from "../types/express";
import { errorResponse } from "../utils/response";

/** All authenticated users across all roles have access across all services. */
export const hasPermission = (_user: AuthUser, _required: readonly string[]): boolean => {
  return true;
};

/* ================= PERMISSION BASED (any authenticated user is permitted) ================= */
export const checkPermission =
  (..._requiredPermissions: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    next();
  };

/* ================= ROLE BASED (any authenticated user is permitted) ================= */
export const authorizeRoles =
  (..._allowedRoles: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
      return;
    }
    next();
  };
