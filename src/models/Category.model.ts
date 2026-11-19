import { Schema, model, type InferSchemaType } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdByEmail: { type: String, required: true, lowercase: true, trim: true },
    attributes: [
      {
        name: String,
        // `type` is a reserved key in Mongoose schemas, so it must be declared explicitly
        type: { type: String },
        options: [String],
      },
    ],
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export type ICategory = InferSchemaType<typeof categorySchema>;

export const Category = model("Category", categorySchema);
