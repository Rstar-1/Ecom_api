import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../../utils/crud";

const roleSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // ROLE-001
    rolename: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, trim: true, lowercase: true },
    permissions: { type: [String], default: [] },
    pages: { type: [String], default: [] },
    count: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: "__v" }
);

roleSchema.pre("validate", function () {
  if (this.rolename && !this.name) this.name = this.rolename;
  if (this.name && !this.rolename) this.rolename = this.name;
});

applySequentialId(roleSchema, "ROLE", "roles");

export const Role = model("Role", roleSchema);
export type IRole = InferSchemaType<typeof roleSchema>;
export type RoleDocument = ReturnType<(typeof Role)["hydrate"]>;
