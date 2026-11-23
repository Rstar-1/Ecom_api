import jsonwebtoken, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import type { AuthUser } from "../types/express";

export const generateToken = (payload: AuthUser, secret: string, expiresIn = "1d"): string =>
  jsonwebtoken.sign(payload, secret, { expiresIn: expiresIn as NonNullable<SignOptions["expiresIn"]> });

const isAuthUser = (payload: string | JwtPayload): payload is JwtPayload & AuthUser =>
  typeof payload === "object" &&
  typeof payload.id === "string" &&
  typeof payload.role === "string" &&
  Array.isArray(payload.permissions);

const optionalString = (value: unknown): string | undefined =>
  value === undefined || value === null || value === "" ? undefined : String(value);

/** Returns the decoded user, or null when the token is invalid, expired or malformed. */
export const verifyToken = (token: string, secret: string): AuthUser | null => {
  try {
    const decoded = jsonwebtoken.verify(token, secret);
    if (!isAuthUser(decoded)) return null;

    const user: AuthUser = {
      id: decoded.id,
      role: decoded.role.toLowerCase(),
      permissions: decoded.permissions.map(String),
    };
    const email = optionalString(decoded.email);
    const userId = optionalString(decoded.userId);
    const roleId = optionalString(decoded.roleId);
    if (email) user.email = email;
    if (userId) user.userId = userId;
    if (roleId) user.roleId = roleId;
    return user;
  } catch {
    return null;
  }
};

export const jwt = {
  generateToken,
  verifyToken,
};
