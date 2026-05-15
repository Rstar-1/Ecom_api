import * as orderService from "./order.service.js";
import { utils } from "../../../../../shared/index.js";
const { successResponse, errorResponse, asyncHandler } = utils;

export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { address } = req.body;
  const token = req.headers.authorization;
  const order = await orderService.createOrderFromCart(userId, address, token);
  return successResponse(res, order, "Order created successfully", 201);
});

export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await orderService.getOrderById(id);
  return successResponse(res, order, "Order fetched successfully");
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const orders = await orderService.getUserOrders(userId);
  return successResponse(res, orders, "User orders fetched successfully");
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const order = await orderService.cancelOrder(id, userId);
  return successResponse(res, order, "Order cancelled successfully");
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(id, status);
  return successResponse(res, order, `Order status updated to ${status}`);
});

// For payment service to update order
export const updatePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, razorpayOrderId } = req.body;
  const order = await orderService.updatePaymentStatus(id, paymentStatus, razorpayOrderId);
  return successResponse(res, order, "Payment status updated");
});
