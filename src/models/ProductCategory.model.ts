import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../utils/crud";
import { aliasVirtual, withVirtuals } from "./plugins";

const productCategorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // PCAT-001
    categoryName: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    iconName: { type: String, default: "", trim: true },
    count: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  withVirtuals
);

aliasVirtual(productCategorySchema, "name", "categoryName");
applySequentialId(productCategorySchema, "PCAT", "categories");

/** Stored in the `categories` collection. */
export const ProductCategory = model("ProductCategory", productCategorySchema, "categories");

export type IProductCategory = InferSchemaType<typeof productCategorySchema>;
