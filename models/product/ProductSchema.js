import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    category: { type: String, required: true, index: true },
    subCategory: { type: String, required: true },

    price: { type: Number, required: true, min: 0 },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (val) {
          return val <= this.price;
        },
        message: "Discount price must be <= price",
      },
    },

    stock: { type: Number, required: true, default: 0 },
    images: [String],
    thumbnail: { type: String, required: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "auth", required: true },

    ratingsAverage: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },

    reviews: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "auth" },
        message: String,
        rating: { type: Number, min: 1, max: 5 },
      },
    ],

    variants: [{ color: String, size: String, price: Number, stock: Number }],
    specifications: [{ title: String, value: String }],

    isFeatured: { type: Boolean, default: false },
    status: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for searching by title and description
productSchema.index({ title: "text", description: "text" });

export default mongoose.model("product", productSchema);