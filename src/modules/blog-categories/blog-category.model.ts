import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../../utils/crud";
import { aliasVirtual, withVirtuals } from "../../utils";

const blogCategorySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // BCAT-001
    categoryName: { type: String, required: true, trim: true },
    count: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  withVirtuals
);

aliasVirtual(blogCategorySchema, "name", "categoryName");
applySequentialId(blogCategorySchema, "BCAT", "blogcategories");

export const BlogCategory = model("BlogCategory", blogCategorySchema, "blogcategories");
export type IBlogCategory = InferSchemaType<typeof blogCategorySchema>;
