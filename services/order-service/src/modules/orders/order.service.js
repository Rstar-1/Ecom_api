import { models } from "../../../../../shared/index.js";
import axios from "axios";
import { ENV } from "../../config/env.js";

const { Order } = models;

export const createOrderFromCart = async (userId, address, token) => {
  // Fetch cart from cart-service
  const cartResponse = await axios.get(`${ENV.CART_SERVICE_URL}/api/cart`, {
    headers: { Authorization: token }
  });

  const cart = cartResponse.data.data;

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Create order
  const order = await Order.create({
    userId,
    items: cart.items,
    totalAmount: cart.totalAmount,
    address,
    status: "pending",
    paymentStatus: "pending"
  });

  // Clear cart after order creation (optional: could be done after payment)
  // For now, let's keep it until payment is confirmed or clear it now if it's the design.
  // Many e-commerce sites clear it once the order is placed (pending payment).
  await axios.delete(`${ENV.CART_SERVICE_URL}/api/cart/clear`, {
    headers: { Authorization: token }
  });

  return order;
};

export const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  return order;
};

export const getUserOrders = async (userId) => {
  return await Order.find({ userId }).sort({ createdAt: -1 });
};

export const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending") throw new Error("Order cannot be cancelled");
  
  order.status = "cancelled";
  return await order.save();
};

export const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  order.status = status;
  return await order.save();
};

export const updatePaymentStatus = async (orderId, paymentStatus, razorpayOrderId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new Error("Order not found");
  order.paymentStatus = paymentStatus;
  if (razorpayOrderId) order.razorpayOrderId = razorpayOrderId;
  return await order.save();
};
