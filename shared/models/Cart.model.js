import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    name: String,
    image: String,

    price: Number,
    quantity: { type: Number, default: 1 },

    variant: {
      size: String,
      color: String,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

    items: [cartItemSchema],

    totalAmount: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Cart", cartSchema);
