import mongoose, { type Schema } from "mongoose";
import { AppError } from "./AppError";

export type Filter = Record<string, unknown>;

/* ================= MONGOOSE SCHEMA HELPERS ================= */
export const aliasVirtual = (schema: Schema, virtualName: string, path: string): void => {
  schema
    .virtual(virtualName)
    .get(function () {
      return this.get(path);
    })
    .set(function (value: unknown) {
      this.set(path, value);
    });
};

export const withVirtuals = {
  timestamps: true,
  versionKey: "__v",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
} as const;

/* ================= VALUE PARSING & TYPE GUARDS ================= */
export const toBool = (value: unknown): boolean =>
  value === true || value === "true" || value === 1 || value === "1";

export const str = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

export const toNumber = (value: unknown, fallback = 0): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-f\d]{24}$/i.test(value);

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const exactCi = (value: string) => ({
  $regex: `^${escapeRegex(value)}$`,
  $options: "i",
});

export const containsCi = (value: string) => ({
  $regex: escapeRegex(value),
  $options: "i",
});

export const parseList = <T = string>(field: unknown): T[] => {
  if (Array.isArray(field)) return field as T[];
  if (typeof field === "string" && field.trim()) {
    try {
      const parsed: unknown = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      /* not JSON - fallback to comma-separated */
    }
    return field
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as T[];
  }
  return [];
};

export const parseAddress = (address: unknown): string[] => {
  if (!address) return ["", ""];
  if (typeof address === "string") {
    try {
      const parsed: unknown = JSON.parse(address);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}
    return [address, ""];
  }
  if (Array.isArray(address)) {
    return address.map((a: unknown) =>
      typeof a === "object" && a !== null
        ? Object.values(a).filter(Boolean).join(", ")
        : String(a)
    );
  }
  return ["", ""];
};

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

export const mergeObjects = <T extends object>(
  oldObj?: T | null,
  newObj?: Partial<T> | null
): T => ({ ...(oldObj ?? {}), ...(newObj ?? {}) }) as T;

/* ================= QUERY FILTERS ================= */
export interface ListQuery {
  page?: string | number;
  limit?: string | number;
  search?: string;
  isDeleted?: string | boolean;
  isActive?: string | boolean;
}

export const baseListFilter = (
  query: Pick<ListQuery, "isDeleted" | "isActive">
): Filter => {
  const filter: Filter = {};
  if (query.isDeleted === undefined) filter.isDeleted = false;
  else if (query.isDeleted !== "all") filter.isDeleted = toBool(query.isDeleted);
  if (query.isActive !== undefined) filter.isActive = toBool(query.isActive);
  return filter;
};

export const searchFilter = (
  search: string | undefined,
  fields: readonly string[]
): Filter => {
  const term = str(search);
  return term ? { $or: fields.map((field) => ({ [field]: containsCi(term) })) } : {};
};

export const identifierFilter = (
  identifier: string,
  extra: (value: string) => Filter[] = () => []
): Filter => {
  const value = str(identifier);
  if (!value) throw AppError.badRequest("Identifier is required");
  return {
    $or: isObjectId(value)
      ? [{ _id: new mongoose.Types.ObjectId(value) }, { id: value }]
      : [{ id: value }, ...extra(value)],
  };
};

/* ================= BULK ACTIONS ================= */
export interface BulkDeleteBody {
  ids?: unknown;
  permanent?: unknown;
  force?: unknown;
  [key: string]: unknown;
}

export const readBulkIds = (body: unknown, altKey = "ids"): string[] => {
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
  !!body &&
  typeof body === "object" &&
  !Array.isArray(body) &&
  (toBool((body as BulkDeleteBody).permanent) || toBool((body as BulkDeleteBody).force));

export const bulkFilter = (ids: string[], extraFields: readonly string[] = []): Filter => ({
  $or: [
    { _id: { $in: ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id)) } },
    { id: { $in: ids } },
    ...extraFields.map((field) => ({ [field]: { $in: ids } })),
  ],
});

/* ================= SEQUENTIAL IDS ================= */
export const nextSequentialId = async (
  collection: string,
  prefix: string
): Promise<string> => {
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
    /* fallback to time-based sequential id */
  }
  return `${prefix}-${Date.now().toString().slice(-4)}`;
};

export const applySequentialId = (
  schema: Schema,
  prefix: string,
  collection: string
): void => {
  schema.pre("validate", async function () {
    const current: unknown = this.get("id");
    if (typeof current !== "string" || !current.trim()) {
      this.set("id", await nextSequentialId(collection, prefix));
    }
  });
};
