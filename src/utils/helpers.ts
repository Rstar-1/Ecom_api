/** Normalises an address into the string[] shape used by the User model. */
export const parseAddress = (address: unknown): string[] => {
  if (!address) return ["", ""];
  if (typeof address === "string") {
    try {
      const parsed: unknown = JSON.parse(address);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      /* plain string */
    }
    return [address, ""];
  }
  if (Array.isArray(address)) {
    return address.map((a: unknown) =>
      typeof a === "object" && a !== null ? Object.values(a).filter(Boolean).join(", ") : String(a)
    );
  }
  return ["", ""];
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

export const mergeObjects = <T extends object>(oldObj?: T | null, newObj?: Partial<T> | null): T =>
  ({ ...(oldObj ?? {}), ...(newObj ?? {}) }) as T;
