import { Schema, model, type InferSchemaType } from "mongoose";

const variantSchema = new Schema(
  {
    size: String,
    color: String,
    price: Number,
    stock: Number,
    sku: String,
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    description: String,
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    // Reference to User with role "vendor"
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vendorEmail: { type: String, required: true, lowercase: true, trim: true },
    images: [String],
    basePrice: { type: Number, required: true },
    attributes: { type: Map, of: Schema.Types.Mixed },
    variants: [variantSchema],
    totalStock: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export type IProduct = InferSchemaType<typeof productSchema>;

export const Product = model("Product", productSchema);
