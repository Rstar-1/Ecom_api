import { messages, roles, statusCodes } from "../constants/index.js";

/* ================= PERMISSION BASED ================= */
export const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(statusCodes.HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: messages.UNAUTHORIZED,
        });
      }

      const userRole = (user.role || "").toLowerCase();

      // Admin or manager bypasses permission check
      if (
        userRole === roles.ADMIN ||
        userRole === "admin" ||
        userRole === roles.MANAGER ||
        userRole === "manager"
      ) {
        return next();
      }

      if (!Array.isArray(user.permissions)) {
        return res.status(statusCodes.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Permissions not assigned",
        });
      }

      // Full access wildcard bypass
      if (
        user.permissions.includes("*") ||
        user.permissions.includes("Full_Access") ||
        user.permissions.some((p) => String(p).toLowerCase() === "full_access")
      ) {
        return next();
      }

      // Normalize required permissions
      const flatRequired = requiredPermissions.flat().map((p) => String(p).toLowerCase());

      if (flatRequired.includes("*")) {
        return next();
      }

      const userPermsLower = user.permissions.map((p) => String(p).toLowerCase());

      const hasPermission = flatRequired.some((reqPerm) => {
        if (userPermsLower.includes(reqPerm)) return true;
        // Map USER_VIEW -> view_systemuser, view_customers, view_users
        if (
          reqPerm === "user_view" &&
          (userPermsLower.includes("view_systemuser") ||
            userPermsLower.includes("view_customers") ||
            userPermsLower.includes("view_users") ||
            userPermsLower.includes("view_user") ||
            userPermsLower.includes("user_view") ||
            userPermsLower.includes("users") ||
            userPermsLower.includes("system users") ||
            userPermsLower.includes("system_users"))
        ) {
          return true;
        }
        if (
          reqPerm === "user_update" &&
          (userPermsLower.includes("edit_systemuser") ||
            userPermsLower.includes("edit_customers") ||
            userPermsLower.includes("edit_users") ||
            userPermsLower.includes("edit_user") ||
            userPermsLower.includes("user_update"))
        ) {
          return true;
        }
        if (
          reqPerm === "user_delete" &&
          (userPermsLower.includes("trash_systemuser") ||
            userPermsLower.includes("delete_systemuser") ||
            userPermsLower.includes("trash_customers") ||
            userPermsLower.includes("delete_customers") ||
            userPermsLower.includes("trash_users") ||
            userPermsLower.includes("delete_users") ||
            userPermsLower.includes("user_delete"))
        ) {
          return true;
        }
        return false;
      });

      if (!hasPermission) {
        return res.status(statusCodes.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: messages.FORBIDDEN,
        });
      }

      return next();
    } catch (error) {
      return res.status(statusCodes.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  };
};

/* ================= ROLE BASED ================= */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(statusCodes.HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: messages.UNAUTHORIZED,
        });
      }

      const userRole = (user.role || "").toLowerCase();
      const normalized = allowedRoles.map((r) => String(r).toLowerCase());

      if (!normalized.includes(userRole)) {
        return res.status(statusCodes.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: messages.FORBIDDEN,
        });
      }

      return next();
    } catch (error) {
      return res.status(statusCodes.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  };
};
