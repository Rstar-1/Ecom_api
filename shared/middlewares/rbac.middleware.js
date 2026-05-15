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

      if (user.role === roles.ADMIN) {
        return next();
      }

      if (!Array.isArray(user.permissions)) {
        return res.status(statusCodes.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "Permissions not assigned",
        });
      }

      if (requiredPermission === "*") {
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

      const userRole = user.role?.toLowerCase();

      if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
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