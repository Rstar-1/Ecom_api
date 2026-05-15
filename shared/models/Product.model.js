import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    size: String,
    color: String,
    price: Number,
    stock: Number,
    sku: String,
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: String,

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    // Reference to User with role "vendor"
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    vendorEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    images: [String],

    basePrice: {
      type: Number,
      required: true,
    },

    attributes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },

    variants: [variantSchema],

    totalStock: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Product", productSchema);
