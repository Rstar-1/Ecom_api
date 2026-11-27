import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../../utils/crud";
import { aliasVirtual, withVirtuals } from "../../utils";
import { reviewSchema, specificationSchema } from "../products/product.model";

const blogSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // BLOG-001
    categoryId: { type: Schema.Types.ObjectId, ref: "BlogCategory", required: true },
    blogName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDesc: { type: String, default: "", trim: true },
    quote: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    readTime: { type: String, default: "1 min read" },
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

aliasVirtual(blogSchema, "name", "blogName");
aliasVirtual(blogSchema, "title", "blogName");
aliasVirtual(blogSchema, "VendorBy", "vendorBy");
applySequentialId(blogSchema, "BLOG", "blogs");

blogSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });
blogSchema.index({ categoryId: 1, isDeleted: 1 });
blogSchema.index({ vendorBy: 1 });

export const Blog = model("Blog", blogSchema, "blogs");
export type IBlog = InferSchemaType<typeof blogSchema>;
export type BlogDocument = ReturnType<(typeof Blog)["hydrate"]>;
