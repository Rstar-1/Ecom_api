import { Role } from "../models";
import { roles } from "../constants";
import { AppError } from "./AppError";

/** Accepts an array or a JSON string (multipart form fields) and always returns an array. */
export const parseAddress = <T = unknown>(address: unknown): T[] => {
  if (!address) return [];
  if (typeof address === "string") {
    try {
      const parsed: unknown = JSON.parse(address);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return Array.isArray(address) ? (address as T[]) : [];
};

/** Parses a value that may be a JSON string (multipart form fields) into an object. */
export const parseJsonObject = <T extends object>(value: unknown): T | null => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as T) : null;
    } catch {
      return null;
    }
  }
  return typeof value === "object" ? (value as T) : null;
};

export const validateRole = async (role?: string): Promise<string> => {
  if (!role) return roles.USER;
  const exists = await Role.exists({ name: role, isDeleted: false, isActive: true });
  if (!exists) throw AppError.badRequest("Invalid role");
  return role;
};

export const mergeObjects = <T extends object>(oldObj?: T | null, newObj?: Partial<T> | null): T =>
  ({ ...(oldObj ?? {}), ...(newObj ?? {}) }) as T;
