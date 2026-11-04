import { messages, roles, statusCodes } from "../constants/index.js";

/* ================= PERMISSION BASED ================= */
export const checkPermission = (requiredPermission) => {
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

      // Admin or matching role bypasses permission check
      if (userRole === roles.ADMIN || userRole === String(requiredPermission || "").toLowerCase()) {
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
        requiredPermission === "*" ||
        user.permissions.includes("*") ||
        user.permissions.includes("Full_Access")
      ) {
        return next();
      }

      if (!user.permissions.includes(requiredPermission)) {
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
