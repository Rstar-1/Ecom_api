import { messages } from "../constants";
import type { AuthUser } from "../types/express";
import { AppError } from "./AppError";

/** Returns the authenticated user or throws 401 (use after authMiddleware). */
export const getAuthUser = (req: { user?: AuthUser }): AuthUser => {
  if (!req.user) throw AppError.unauthorized(messages.UNAUTHORIZED);
  return req.user;
};
