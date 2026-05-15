import * as paymentService from "./payment.service.js";
import { utils } from "../../../../../shared/index.js";
const { successResponse, errorResponse, asyncHandler } = utils;

export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, amount } = req.body;
  const token = req.headers.authorization;
  const razorpayOrder = await paymentService.createRazorpayOrder(userId, orderId, amount, token);
  return successResponse(res, razorpayOrder, "Razorpay order created");
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const paymentData = req.body;
  const token = req.headers.authorization;
  const result = await paymentService.verifyPayment(userId, paymentData, token);
  return successResponse(res, result, result.message);
});

export const handleCod = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { orderId, amount } = req.body;
  const token = req.headers.authorization;
  const result = await paymentService.handleCodPayment(userId, orderId, amount, token);
  return successResponse(res, result, result.message);
});

export const getPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payment = await paymentService.getPaymentById(id);
  return successResponse(res, payment, "Payment details fetched");
});
