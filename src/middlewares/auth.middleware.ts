import type { NextFunction, Request, Response } from "express";
import { ENV } from "../config/env";
import { HTTP_STATUS, messages } from "../constants";
import { errorResponse } from "../utils/response";
import { verifyToken } from "../utils/jwt";

const readBearerToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() || undefined : undefined;
};

/** Requires a valid JWT; sets req.user. */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = readBearerToken(req);
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

/** Sets req.user when a valid JWT is sent, but never rejects the request. */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const token = readBearerToken(req);
    const decoded = token ? verifyToken(token, ENV.JWT_SECRET) : null;
    if (decoded) req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};
