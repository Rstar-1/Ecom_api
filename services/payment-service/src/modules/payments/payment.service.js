import Razorpay from "razorpay";
import crypto from "crypto";
import axios from "axios";
import { ENV } from "../../config/env.js";
import { models } from "../../../../../shared/index.js";

const { Payment } = models;

const razorpay = new Razorpay({
  key_id: ENV.RAZORPAY_KEY_ID,
  key_secret: ENV.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (userId, orderId, amount, token) => {
  const options = {
    amount: amount * 100, // amount in the smallest currency unit (paise for INR)
    currency: "INR",
    receipt: `receipt_${orderId}`,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Save payment record as pending
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

export const verifyPayment = async (userId, paymentData, token) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = paymentData;

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", ENV.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    // Payment verified
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        status: "success",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      }
    );

    // Update order status in order-service
    await axios.put(`${ENV.ORDER_SERVICE_URL}/api/orders/${orderId}/payment`, {
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id
    }, {
      headers: { Authorization: token }
    });

    return { success: true, message: "Payment verified successfully" };
  } else {
    throw new Error("Invalid payment signature");
  }
};

export const handleCodPayment = async (userId, orderId, amount, token) => {
  await Payment.create({
    userId,
    orderId,
    amount,
    method: "COD",
    status: "pending", // COD is pending until delivered
  });

  // Update order status
  await axios.put(`${ENV.ORDER_SERVICE_URL}/api/orders/${orderId}/payment`, {
    paymentStatus: "pending"
  }, {
    headers: { Authorization: token }
  });

  return { success: true, message: "COD order placed successfully" };
};

export const getPaymentById = async (paymentId) => {
  return await Payment.findById(paymentId);
};
