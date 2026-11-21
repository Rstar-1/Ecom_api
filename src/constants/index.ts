export const messages = {
  SUCCESS: "Operation completed successfully.",
  CREATED: "Resource created successfully.",
  UPDATED: "Resource updated successfully.",
  DELETED: "Resource deleted successfully",
  NOT_FOUND: "Resource not found.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  FORBIDDEN: "Access to this resource is forbidden.",
  INTERNAL_SERVER_ERROR: "An internal server error occurred.",
  INVALID_INPUT: "The input provided is invalid.",
  USER_NOT_FOUND: "User not found.",
  PRODUCT_NOT_FOUND: "Product not found",
  INVALID_CREDENTIALS: "Invalid username or password.",
  TOKEN_EXPIRED: "Token has expired.",
  TOKEN_INVALID: "Token is invalid.",
} as const;

export const roles = {
  ADMIN: "admin",
  DEV_ADMIN: "dev admin",
  MANAGER: "manager",
  CUSTOMER: "customer",
  VENDOR: "vendor",
  ACCOUNTANT: "accountant",
  ARCHIVED: "archived",
} as const;

/** Roles that bypass permission checks (same rule as feature/practice). */
export const SUPER_ROLES: readonly string[] = [
  roles.ADMIN,
  roles.DEV_ADMIN,
  roles.MANAGER,
  "dev admin",
  "dev_admin",
  "devadmin",
  "super admin",
  "super_admin",
];

/** Permission names used by the route guards. Admin/manager and `*` / `Full_Access` bypass them. */
export const PERMISSIONS = {
  USER_CREATE: "USER_CREATE",
  USER_VIEW: "USER_VIEW",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  ROLE_CREATE: "ROLE_CREATE",
  ROLE_UPDATE: "ROLE_UPDATE",
  ROLE_DELETE: "ROLE_DELETE",
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  CATEGORY_CREATE: "CATEGORY_CREATE",
  CATEGORY_UPDATE: "CATEGORY_UPDATE",
  CATEGORY_DELETE: "CATEGORY_DELETE",
  BLOG_CREATE: "BLOG_CREATE",
  BLOG_UPDATE: "BLOG_UPDATE",
  BLOG_DELETE: "BLOG_DELETE",
  LEAD_VIEW: "LEAD_VIEW",
  LEAD_UPDATE: "LEAD_UPDATE",
  LEAD_DELETE: "LEAD_DELETE",
  CAMPAIGN_VIEW: "CAMPAIGN_VIEW",
  CAMPAIGN_MANAGE: "CAMPAIGN_MANAGE",
  CAMPAIGN_SEND: "CAMPAIGN_SEND",
  SEO_MANAGE: "SEO_MANAGE",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
