import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../utils/crud";
import { aliasVirtual, withVirtuals } from "./plugins";

export const LEAD_SEVERITIES = ["high", "medium", "low"] as const;
export type LeadSeverity = (typeof LEAD_SEVERITIES)[number];

const leadSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // LED-001
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    location: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    severity: { type: String, enum: LEAD_SEVERITIES, default: "low", lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  withVirtuals
);

/* UI field names used by the dashboard form */
aliasVirtual(leadSchema, "leadFullName", "name");
aliasVirtual(leadSchema, "mobileNumber", "mobile");
aliasVirtual(leadSchema, "emailAddress", "email");
aliasVirtual(leadSchema, "publishedStatus", "isActive");
leadSchema.virtual("requirementDetails").get(function () {
  return this.notes || this.description;
});

applySequentialId(leadSchema, "LED", "leads");

/* Keep description and notes in sync */
leadSchema.pre("validate", function () {
  if (this.notes && !this.description) this.description = this.notes;
  else if (this.description && !this.notes) this.notes = this.description;
});

export const Lead = model("Lead", leadSchema, "leads");

export type ILead = InferSchemaType<typeof leadSchema>;
