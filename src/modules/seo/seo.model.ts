import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../../utils/crud";
import { withVirtuals } from "../../utils";

export const SEO_TYPES = ["website", "article", "product", "business"] as const;
export type SeoType = (typeof SEO_TYPES)[number];

const breadcrumbSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const seoSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // SEO-001
    name: { type: String, required: true, trim: true },
    page: { type: String, default: "", trim: true },
    path: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    keywords: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    type: { type: String, enum: SEO_TYPES, default: "website", lowercase: true, trim: true },
    noindex: { type: Boolean, default: false },
    breadcrumbs: { type: [breadcrumbSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  withVirtuals
);

applySequentialId(seoSchema, "SEO", "seos");

seoSchema.index({ isDeleted: 1, createdAt: -1 });
seoSchema.index({ page: 1 });

seoSchema.pre("validate", function () {
  if (!this.page && this.name) this.page = this.name;
});

export const SEO = model("SEO", seoSchema, "seos");
export type ISeo = InferSchemaType<typeof seoSchema>;

export interface BreadcrumbInput {
  label: string;
  path: string;
}
