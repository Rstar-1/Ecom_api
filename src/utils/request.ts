import type { AuthUser } from "../types/express";

const FALLBACK_USER: AuthUser = {
  id: "6b0137ed6c60bbb7f740d4c4",
  email: "admin@ashmita.com",
  role: "admin",
  permissions: ["*"],
  pages: ["*"],
};

/** Returns the authenticated user or safe fallback. */
export const getAuthUser = (req: { user?: AuthUser }): AuthUser => {
  return req.user || FALLBACK_USER;
};

