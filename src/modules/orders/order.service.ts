import {
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  Order,
  type OrderPaymentStatus,
  type OrderStatus,
} from "../../models";
import { AppError } from "../../utils";
import * as cartService from "../cart/cart.service";
import type { OrderAddressBody } from "./order.types";

const isOrderStatus = (value: unknown): value is OrderStatus =>
  typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);

const isPaymentStatus = (value: unknown): value is OrderPaymentStatus =>
  typeof value === "string" && (ORDER_PAYMENT_STATUSES as readonly string[]).includes(value);

export const createOrderFromCart = async (userId: string, address?: OrderAddressBody) => {
  if (!address) throw AppError.badRequest("Shipping address is required");

  // Same process: read the cart directly instead of calling a cart service over HTTP
  const cart = await cartService.getCartByUserId(userId);
  if (cart.items.length === 0) throw AppError.badRequest("Cart is empty");

  const order = await Order.create({
    userId,
    items: cart.items.map((item) => item.toObject()),
    totalAmount: cart.totalAmount,
    address,
    status: "pending",
    paymentStatus: "pending",
  });

  // Clear the cart once the order is placed (pending payment)
  await cartService.clearCart(userId);

  return order;
};

export const getOrderById = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) throw AppError.notFound("Order not found");
  return order;
};

export const getUserOrders = (userId: string) => Order.find({ userId }).sort({ createdAt: -1 });

export const cancelOrder = async (orderId: string, userId: string) => {
  const order = await Order.findOne({ _id: orderId, userId });
  if (!order) throw AppError.notFound("Order not found");
  if (order.status !== "pending") throw AppError.badRequest("Order cannot be cancelled");

  order.status = "cancelled";
  return order.save();
};

export const updateOrderStatus = async (orderId: string, status: unknown) => {
  if (!isOrderStatus(status)) {
    throw AppError.badRequest(`Invalid order status. Allowed: ${ORDER_STATUSES.join(", ")}`);
  }
  const order = await getOrderById(orderId);
  order.status = status;
  return order.save();
};

export const updatePaymentStatus = async (
  orderId: string,
  paymentStatus: OrderPaymentStatus,
  razorpayOrderId?: string
) => {
  if (!isPaymentStatus(paymentStatus)) throw AppError.badRequest("Invalid payment status");
  const order = await getOrderById(orderId);
  order.paymentStatus = paymentStatus;
  if (razorpayOrderId) order.razorpayOrderId = razorpayOrderId;
  return order.save();
};
