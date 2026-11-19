import jsonwebtoken, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { AuthUser } from "../types/express";

export const generateToken = (payload: AuthUser, secret: string, expiresIn = "1d"): string =>
  jsonwebtoken.sign(payload, secret, { expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]> });

const isAuthUser = (payload: string | JwtPayload): payload is JwtPayload & AuthUser =>
  typeof payload === "object" &&
  typeof payload.id === "string" &&
  typeof payload.role === "string" &&
  Array.isArray(payload.permissions);

/** Returns the decoded user, or null when the token is invalid, expired or malformed. */
export const verifyToken = (token: string, secret: string): AuthUser | null => {
  try {
    const decoded = jsonwebtoken.verify(token, secret);
    if (!isAuthUser(decoded)) return null;
    const { id, email, role, permissions } = decoded;
    return { id, role, permissions: permissions.map(String), ...(email ? { email: String(email) } : {}) };
  } catch {
    return null;
  }
};
