import crypto from "crypto";
import Razorpay from "razorpay";
import { ENV } from "../../config/env";
import { HTTP_STATUS } from "../../constants";
import { Payment } from "./payment.model";
import { AppError } from "../../utils";
import * as orderService from "../orders/order.service";
import type { PaymentResult, VerifyPaymentBody } from "./payment.types";

interface RazorpayConfig {
  client: Razorpay;
  keySecret: string;
}

/* Created lazily so the app still boots when Razorpay keys are not configured */
let razorpay: RazorpayConfig | null = null;
const getRazorpay = (): RazorpayConfig => {
  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = ENV;
  if (!keyId || !keySecret) {
    throw new AppError(
      "Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)",
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }
  razorpay ??= { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keySecret };
  return razorpay;
};

const requireAmount = (value: unknown): number => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw AppError.badRequest("A valid amount is required");
  return amount;
};

export const createRazorpayOrder = async (userId: string, orderId: string | undefined, rawAmount: unknown) => {
  if (!orderId) throw AppError.badRequest("orderId is required");
  const amount = requireAmount(rawAmount);
  await orderService.getOrderById(orderId); // 404 if the order doesn't exist

  const razorpayOrder = await getRazorpay().client.orders.create({
    amount: Math.round(amount * 100), // smallest currency unit (paise)
    currency: "INR",
    receipt: `receipt_${orderId}`,
  });

  await Payment.create({
    userId,
    orderId,
    amount,
    method: "RAZORPAY",
    status: "pending",
    razorpayOrderId: razorpayOrder.id,
  });

  return razorpayOrder;
};

export const verifyPayment = async (data: VerifyPaymentBody): Promise<PaymentResult> => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = data;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    throw AppError.badRequest("razorpay_order_id, razorpay_payment_id, razorpay_signature and orderId are required");
  }

  const expected = crypto
    .createHmac("sha256", getRazorpay().keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
  if (!valid) throw AppError.badRequest("Invalid payment signature");

  await Payment.findOneAndUpdate(
    { razorpayOrderId: razorpay_order_id },
    { status: "success", razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature }
  );

  // Same process: update the order directly instead of calling an order service over HTTP
  await orderService.updatePaymentStatus(orderId, "paid", razorpay_order_id);

  return { success: true, message: "Payment verified successfully" };
};

export const handleCodPayment = async (
  userId: string,
  orderId: string | undefined,
  rawAmount: unknown
): Promise<PaymentResult> => {
  if (!orderId) throw AppError.badRequest("orderId is required");
  const amount = requireAmount(rawAmount);

  await orderService.updatePaymentStatus(orderId, "pending"); // also 404s on a missing order
  await Payment.create({ userId, orderId, amount, method: "COD", status: "pending" });

  return { success: true, message: "COD order placed successfully" };
};

export const getPaymentById = async (paymentId: string) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw AppError.notFound("Payment not found");
  return payment;
};
