import type { Schema } from "mongoose";

/** Adds a virtual that reads/writes another path (e.g. `name` <-> `productName`) for UI compatibility. */
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

/** Common schema options used by the practice-era collections. */
export const withVirtuals = {
  timestamps: true,
  versionKey: "__v",
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
} as const;
