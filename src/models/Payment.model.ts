import { Schema, model, type InferSchemaType } from "mongoose";

const paymentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    amount: Number,
    method: { type: String, enum: ["COD", "RAZORPAY"] },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true, versionKey: false }
);

export type IPayment = InferSchemaType<typeof paymentSchema>;

export const Payment = model("Payment", paymentSchema);
