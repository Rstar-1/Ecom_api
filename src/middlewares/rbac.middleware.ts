import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ENV } from "../config/env";
import { HTTP_STATUS, messages, SUPER_ROLES } from "../constants";
import { Role } from "../models";
import type { AuthUser } from "../types/express";
import { isObjectId } from "../utils";
import { errorResponse } from "../utils/response";

/** Dashboard permission names that grant backend permissions across all services. */
const PERMISSION_ALIASES: Readonly<Record<string, readonly string[]>> = {
  // User Management
  user_create: [
    "add_users",
    "create_users",
    "manage_users",
    "add_systemuser",
    "create_systemuser",
    "manage_systemuser",
    "add_customers",
    "create_customers",
    "manage_customers",
    "users",
    "system users",
    "system_users",
  ],
  user_view: [
    "view_systemuser",
    "view_customers",
    "view_users",
    "view_user",
    "users",
    "system users",
    "system_users",
    "manage_users",
    "manage_systemuser",
    "manage_customers",
  ],
  user_update: [
    "edit_systemuser",
    "edit_customers",
    "edit_users",
    "edit_user",
    "manage_users",
    "manage_systemuser",
    "manage_customers",
  ],
  user_delete: [
    "trash_systemuser",
    "delete_systemuser",
    "trash_customers",
    "delete_customers",
    "trash_users",
    "delete_users",
    "manage_users",
    "manage_systemuser",
    "manage_customers",
  ],

  // Role Management
  role_create: ["add_roles", "create_roles", "manage_roles", "roles"],
  role_view: ["view_roles", "manage_roles", "roles"],
  role_update: ["edit_roles", "update_roles", "manage_roles", "roles"],
  role_delete: ["trash_roles", "delete_roles", "manage_roles", "roles"],

  // Product Management
  product_create: [
    "add_products",
    "create_products",
    "manage_products",
    "products",
    "view_products",
    "edit_products",
  ],
  product_view: ["view_products", "manage_products", "products"],
  product_update: ["edit_products", "update_products", "manage_products", "products"],
  product_delete: ["trash_products", "delete_products", "manage_products", "products"],

  // Category Management (Product & Blog Categories)
  category_create: [
    "add_categories",
    "create_categories",
    "add_product_categories",
    "manage_categories",
    "manage_product_categories",
    "categories",
    "product_categories",
    "products category",
    "products_category",
  ],
  category_view: [
    "view_categories",
    "view_product_categories",
    "manage_categories",
    "manage_product_categories",
    "categories",
    "product_categories",
    "products category",
    "products_category",
  ],
  category_update: [
    "edit_categories",
    "update_categories",
    "edit_product_categories",
    "manage_categories",
    "manage_product_categories",
    "categories",
    "product_categories",
    "products category",
    "products_category",
  ],
  category_delete: [
    "trash_categories",
    "delete_categories",
    "trash_product_categories",
    "manage_categories",
    "manage_product_categories",
    "categories",
    "product_categories",
    "products category",
    "products_category",
  ],

  // Blog & Blog Categories
  blog_create: [
    "add_blogs",
    "create_blogs",
    "manage_blogs",
    "blogs",
    "add_blog_categories",
    "create_blog_categories",
    "manage_blog_categories",
    "blog_categories",
    "blogs category",
    "blogs_category",
    "view_blogs",
  ],
  blog_view: [
    "view_blogs",
    "manage_blogs",
    "blogs",
    "view_blog_categories",
    "manage_blog_categories",
    "blog_categories",
    "blogs category",
    "blogs_category",
  ],
  blog_update: [
    "edit_blogs",
    "update_blogs",
    "manage_blogs",
    "blogs",
    "edit_blog_categories",
    "update_blog_categories",
    "manage_blog_categories",
    "blog_categories",
    "blogs category",
    "blogs_category",
  ],
  blog_delete: [
    "trash_blogs",
    "delete_blogs",
    "manage_blogs",
    "blogs",
    "trash_blog_categories",
    "delete_blog_categories",
    "manage_blog_categories",
    "blog_categories",
    "blogs category",
    "blogs_category",
  ],

  // Lead Management
  lead_view: ["view_leads", "manage_leads", "leads"],
  lead_update: ["edit_leads", "update_leads", "manage_leads", "leads", "add_leads"],
  lead_delete: ["trash_leads", "delete_leads", "manage_leads", "leads"],

  // Campaign Management
  campaign_view: ["view_campaign", "view_campaigns", "manage_campaign", "campaigns"],
  campaign_manage: ["manage_campaign", "add_campaign", "edit_campaign", "campaigns"],
  campaign_send: ["send_campaign", "manage_campaign", "campaigns"],

  // SEO Management
  seo_manage: ["view_seo", "add_seo", "edit_seo", "trash_seo", "manage_seo", "seo"],

  // Order Management
  order_view: ["view_orders", "manage_orders", "orders"],
  order_update: ["edit_orders", "manage_orders", "orders", "add_orders"],
  order_delete: ["trash_orders", "delete_orders", "manage_orders", "orders"],
};

const FULL_ACCESS = ["*", "full_access"];

/** True when the user is an admin/super role, in dev mode, or holds any of the required permissions. */
export const hasPermission = (user: AuthUser, required: readonly string[]): boolean => {
  // In development mode, allow all authenticated users across all services
  if (ENV.NODE_ENV === "development") return true;

  const userRole = (user.role || "").toLowerCase().trim();
  if (
    SUPER_ROLES.some((r) => r.toLowerCase() === userRole) ||
    userRole.includes("admin") ||
    userRole.includes("manager")
  ) {
    return true;
  }

  const userPerms = (user.permissions || []).map((p) => String(p).toLowerCase().trim());
  const userPages = (user.pages || []).map((p) => String(p).toLowerCase().trim());
  const combinedPerms = new Set([...userPerms, ...userPages]);

  if (
    userPerms.some((p) => FULL_ACCESS.includes(p)) ||
    combinedPerms.has("full_access") ||
    combinedPerms.has("*")
  ) {
    return true;
  }

  const requiredLower = required.map((p) => String(p).toLowerCase().trim());
  if (requiredLower.includes("*")) return true;

  return requiredLower.some((perm) => {
    if (combinedPerms.has(perm)) return true;
    const aliases = PERMISSION_ALIASES[perm] ?? [];
    return aliases.some((alias) => combinedPerms.has(alias.toLowerCase()));
  });
};

/* ================= PERMISSION BASED (any of the given permissions) ================= */
export const checkPermission =
  (...requiredPermissions: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const run = async () => {
      const user = req.user;
      if (!user) {
        errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
        return;
      }

      // If in development mode, immediately allow
      if (ENV.NODE_ENV === "development") {
        next();
        return;
      }

      // Check if user already satisfies permission with current token
      if (hasPermission(user, requiredPermissions)) {
        next();
        return;
      }

      // Fallback: Reload live permissions and pages from Role in database
      try {
        const roleDoc = await Role.findOne({
          $or: [
            ...(user.roleId && isObjectId(user.roleId) ? [{ _id: user.roleId }] : []),
            { rolename: (user.role || "").toLowerCase() },
            { name: (user.role || "").toLowerCase() },
          ],
          isDeleted: false,
        }).lean();

        if (roleDoc) {
          if (Array.isArray(roleDoc.permissions)) {
            user.permissions = roleDoc.permissions;
          }
          if (Array.isArray(roleDoc.pages)) {
            user.pages = roleDoc.pages;
          }
        }
      } catch {}

      if (!hasPermission(user, requiredPermissions)) {
        errorResponse(res, messages.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        return;
      }
      next();
    };

    run().catch(next);
  };

/* ================= ROLE BASED ================= */
export const authorizeRoles =
  (...allowedRoles: string[]): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      // In development mode, allow all authenticated users
      if (ENV.NODE_ENV === "development") {
        next();
        return;
      }

      const user = req.user;
      if (!user) {
        errorResponse(res, messages.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
        return;
      }
      const userRole = (user.role || "").toLowerCase().trim();
      if (userRole.includes("admin") || userRole.includes("manager")) {
        next();
        return;
      }

      const allowed = allowedRoles.map((r) => r.toLowerCase().trim());
      if (!allowed.includes(userRole)) {
        errorResponse(res, messages.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
