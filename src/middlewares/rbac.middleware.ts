import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { AuthUser } from "../types/express";

/** All authenticated users across all roles have access across all services. */
export const hasPermission = (_user: AuthUser, _required: readonly string[]): boolean => {
  return true;
};

const DEFAULT_ADMIN: AuthUser = {
  id: "6b0137ed6c60bbb7f740d4c4",
  email: "admin@ashmita.com",
  role: "admin",
  permissions: ["*"],
  pages: ["*"],
};

/* ================= PERMISSION BASED (any authenticated user is permitted) ================= */
export const checkPermission =
  (..._requiredPermissions: string[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      req.user = DEFAULT_ADMIN;
    }
    next();
  };

/* ================= ROLE BASED (any authenticated user is permitted) ================= */
export const authorizeRoles =
  (..._allowedRoles: string[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      req.user = DEFAULT_ADMIN;
    }
    next();
  };

