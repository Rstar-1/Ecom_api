import mongoose, { type Schema } from "mongoose";
import { AppError } from "./AppError";

/* =====================================================================
   Small, typed helpers shared by the CRUD modules (ported from the
   repeated logic in feature/practice).
   ===================================================================== */

export type Filter = Record<string, unknown>;

/* ================= VALUE PARSING ================= */
export const toBool = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

/** Trimmed string; "" for null/undefined. */
export const str = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

export const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Case-insensitive exact match condition. */
export const exactCi = (value: string) => ({ $regex: `^${escapeRegex(value)}$`, $options: "i" });

/** Case-insensitive "contains" condition (user input is escaped). */
export const containsCi = (value: string) => ({ $regex: escapeRegex(value), $options: "i" });

/** Accepts an array, a JSON array string, or a comma-separated string. */
export const parseList = <T = string>(field: unknown): T[] => {
  if (Array.isArray(field)) return field as T[];
  if (typeof field === "string" && field.trim()) {
    try {
      const parsed: unknown = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      /* not JSON – fall through to comma separated */
    }
    return field
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as T[];
  }
  return [];
};

/* ================= LOOKUPS ================= */
/**
 * Matches a document by Mongo _id, custom `id` (e.g. PROD-001) or any extra field.
 * `extra` receives the raw identifier and returns additional `$or` conditions.
 */
export const identifierFilter = (identifier: string, extra: (value: string) => Filter[] = () => []): Filter => {
  const value = str(identifier);
  if (!value) throw AppError.badRequest("Identifier is required");
  return {
    $or: isObjectId(value)
      ? [{ _id: new mongoose.Types.ObjectId(value) }, { id: value }]
      : [{ id: value }, ...extra(value)],
  };
};

/* ================= LIST QUERIES ================= */
export interface ListQuery {
  page?: string;
  limit?: string;
  search?: string;
  isDeleted?: string;
  isActive?: string;
}

/** isDeleted=false by default, "true"/"false" to choose, "all" for both. */
export const baseListFilter = (query: Pick<ListQuery, "isDeleted" | "isActive">): Filter => {
  const filter: Filter = {};
  if (query.isDeleted === undefined) filter.isDeleted = false;
  else if (query.isDeleted !== "all") filter.isDeleted = toBool(query.isDeleted);
  if (query.isActive !== undefined) filter.isActive = toBool(query.isActive);
  return filter;
};

export const searchFilter = (search: string | undefined, fields: readonly string[]): Filter => {
  const term = str(search);
  return term ? { $or: fields.map((field) => ({ [field]: containsCi(term) })) } : {};
};

export interface PageInfo {
  isPaginated: boolean;
  page: number;
  limit: number;
  skip: number;
}

/** Pagination is applied only when ?page or ?limit is sent (as in feature/practice). */
export const readPagination = (query: Pick<ListQuery, "page" | "limit">, defaultLimit = 10, always = false): PageInfo => {
  const isPaginated = always || query.page !== undefined || query.limit !== undefined;
  const page = Math.max(1, Number.parseInt(query.page ?? "", 10) || 1);
  const limit = Math.min(Math.max(1, Number.parseInt(query.limit ?? "", 10) || defaultLimit), 500);
  return { isPaginated, page, limit, skip: (page - 1) * limit };
};

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type PagedResult<K extends string, T> = Record<K, T[]> & Pagination & { pagination: Pagination };

export const pagedResult = <K extends string, T>(
  key: K,
  items: T[],
  total: number,
  { page, limit }: Pick<PageInfo, "page" | "limit">
): PagedResult<K, T> => {
  const pagination: Pagination = { total, page, limit, totalPages: Math.ceil(total / limit) };
  return { [key]: items, ...pagination, pagination } as PagedResult<K, T>;
};

/* ================= BULK DELETE ================= */
export interface BulkDeleteBody {
  ids?: unknown;
  permanent?: unknown;
  force?: unknown;
  [key: string]: unknown;
}

/** Reads ids from `[...]`, `{ ids }` or `{ <altKey> }` (e.g. productIds). */
export const readBulkIds = (body: unknown, altKey: string): string[] => {
  const source = Array.isArray(body)
    ? body
    : body && typeof body === "object"
      ? ((body as BulkDeleteBody).ids ?? (body as BulkDeleteBody)[altKey])
      : undefined;
  const ids = Array.isArray(source) ? source.map(String).filter(Boolean) : [];
  if (ids.length === 0) throw AppError.badRequest("No IDs provided for bulk delete");
  return ids;
};

export const isPermanent = (body: unknown): boolean =>
  !!body && typeof body === "object" && !Array.isArray(body) && (toBool((body as BulkDeleteBody).permanent) || toBool((body as BulkDeleteBody).force));

/** Filter matching any of the ids against _id, custom `id` and extra string fields. */
export const bulkFilter = (ids: string[], extraFields: readonly string[] = []): Filter => ({
  $or: [
    { _id: { $in: ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id)) } },
    { id: { $in: ids } },
    ...extraFields.map((field) => ({ [field]: { $in: ids } })),
  ],
});

/* ================= SEQUENTIAL IDS (PROD-001, LED-002, ...) ================= */
export const nextSequentialId = async (collection: string, prefix: string): Promise<string> => {
  const pattern = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`);
  try {
    if (mongoose.connection.readyState === mongoose.ConnectionStates.connected) {
      const docs = await mongoose.connection
        .collection(collection)
        .find({ id: { $regex: pattern } }, { projection: { id: 1 }, maxTimeMS: 5000 })
        .toArray();
      const max = docs.reduce((acc, doc) => {
        const match = typeof doc.id === "string" ? pattern.exec(doc.id) : null;
        return match?.[1] ? Math.max(acc, Number.parseInt(match[1], 10)) : acc;
      }, 0);
      const next = max + 1;
      return `${prefix}-${String(next).padStart(Math.max(3, String(next).length), "0")}`;
    }
  } catch {
    /* fall back to a time based id */
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
};

/** Fills a missing `id` field with the next PREFIX-NNN value before validation. */
export const applySequentialId = (schema: Schema, prefix: string, collection: string): void => {
  schema.pre("validate", async function () {
    const current: unknown = this.get("id");
    if (typeof current !== "string" || !current.trim()) {
      this.set("id", await nextSequentialId(collection, prefix));
    }
  });
};
