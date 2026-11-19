import { Schema, model, type InferSchemaType } from "mongoose";

export const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;
export const ORDER_PAYMENT_STATUSES = ["pending", "paid", "failed"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    vendorId: { type: Schema.Types.ObjectId, ref: "User" },
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

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
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
    paymentStatus: { type: String, enum: ORDER_PAYMENT_STATUSES, default: "pending" },
    razorpayOrderId: String,
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
  },
  { timestamps: true, versionKey: false }
);

export type IOrder = InferSchemaType<typeof orderSchema>;
export type OrderAddress = NonNullable<IOrder["address"]>;

export const Order = model("Order", orderSchema);
