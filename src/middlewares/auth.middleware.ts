import type { NextFunction, Request, Response } from "express";
import { ENV } from "../config/env";
import { HTTP_STATUS, messages } from "../constants";
import { errorResponse } from "../utils/response";
import { verifyToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : undefined;

    if (!token) {
      errorResponse(res, "Authorization token missing", HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    const decoded = verifyToken(token, ENV.JWT_SECRET);
    if (!decoded) {
      errorResponse(res, messages.TOKEN_INVALID, HTTP_STATUS.UNAUTHORIZED);
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
