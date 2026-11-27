import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../../utils/crud";
import { aliasVirtual, withVirtuals } from "../../utils";

export const PRODUCT_SEVERITIES = ["pending", "approved", "rejected", "low", "medium", "high"] as const;

export const specificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

export const reviewSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    comment: { type: String, default: "", trim: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export interface SpecificationInput {
  name: string;
  value: string;
}

export interface ReviewInput {
  id?: string;
  comment?: string;
  rating?: number | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
}

const productSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // PROD-001
    productName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    shortDesc: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "Pcs" },
    currency: { type: String, default: "INR" },
    totalStock: { type: Number, default: 0, min: 0 },
    reservedStock: { type: Number, default: 0, min: 0 },
    stockStatus: { type: Boolean, default: true },
    isTrending: { type: Boolean, default: false },
    severity: { type: String, enum: PRODUCT_SEVERITIES, default: "pending", lowercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "ProductCategory", required: true },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    badges: { type: [String], default: [] },
    specifications: { type: [specificationSchema], default: [] },
    reviews: { type: [reviewSchema], default: [] },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    vendorBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  withVirtuals
);

aliasVirtual(productSchema, "name", "productName");
aliasVirtual(productSchema, "VendorBy", "vendorBy");
applySequentialId(productSchema, "PROD", "products");

productSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });
productSchema.index({ categoryId: 1, isDeleted: 1 });
productSchema.index({ vendorBy: 1 });

export const Product = model("Product", productSchema, "products");
export type IProduct = InferSchemaType<typeof productSchema>;
export type ProductDocument = ReturnType<(typeof Product)["hydrate"]>;
