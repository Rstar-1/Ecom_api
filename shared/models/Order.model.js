import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    name: String,
    image: String,

    price: Number,
    quantity: Number,

    variant: {
      size: String,
      color: String,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    items: [orderItemSchema],

    totalAmount: Number,

    address: {
      fullName: String,
      phone: String,
      addressLine: String,
      city: String,
      state: String,
      pincode: String,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    razorpayOrderId: String,

    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Order", orderSchema);
