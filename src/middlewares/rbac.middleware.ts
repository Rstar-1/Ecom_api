import type { NextFunction, Request, RequestHandler, Response } from "express";
import { HTTP_STATUS, messages, SUPER_ROLES } from "../constants";
import type { AuthUser } from "../types/express";
import { errorResponse } from "../utils/response";

/** Dashboard permission names that also grant the USER_* permissions (kept from feature/practice). */
const PERMISSION_ALIASES: Readonly<Record<string, readonly string[]>> = {
  user_view: ["view_systemuser", "view_customers", "view_users", "view_user", "users", "system users", "system_users"],
  user_update: ["edit_systemuser", "edit_customers", "edit_users", "edit_user"],
  user_delete: [
    "trash_systemuser",
    "delete_systemuser",
    "trash_customers",
    "delete_customers",
    "trash_users",
    "delete_users",
  ],
};

const FULL_ACCESS = ["*", "full_access"];

/** True when the user is admin/manager, has full access, or holds any of the required permissions. */
export const hasPermission = (user: AuthUser, required: readonly string[]): boolean => {
  if (SUPER_ROLES.includes(user.role.toLowerCase())) return true;

  const userPerms = user.permissions.map((p) => p.toLowerCase());
  if (userPerms.some((p) => FULL_ACCESS.includes(p))) return true;

  const requiredLower = required.map((p) => p.toLowerCase());
  if (requiredLower.includes("*")) return true;

  return requiredLower.some(
    (perm) => userPerms.includes(perm) || (PERMISSION_ALIASES[perm] ?? []).some((alias) => userPerms.includes(alias))
  );
};

/* ================= PERMISSION BASED (any of the given permissions) ================= */
export const checkPermission =
  (...requiredPermissions: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      if (!user) {
        errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      if (!Array.isArray(user.permissions)) {
        errorResponse(res, "Permissions not assigned", HTTP_STATUS.FORBIDDEN);
        return;
      }
      if (!hasPermission(user, requiredPermissions)) {
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
