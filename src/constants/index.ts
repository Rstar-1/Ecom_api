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
  VENDOR: "vendor",
  CUSTOMER: "customer",
  USER: "user",
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
