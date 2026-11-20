import { Schema } from "mongoose";

/** Name/value pair shown on product and blog pages. */
export const specificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

/** Review embedded in products and blogs. */
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
