import { Schema, model, type InferSchemaType } from "mongoose";

const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    permissions: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true, versionKey: false }
);

export type IRole = InferSchemaType<typeof roleSchema>;

export const Role = model("Role", roleSchema);
