import jwt from "../utils/jwt.js";
import { statusCodes, messages } from "../constants/index.js";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(statusCodes.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verifyToken(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(statusCodes.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: messages.TOKEN_INVALID,
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(statusCodes.HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: messages.UNAUTHORIZED,
    });
  }
};
