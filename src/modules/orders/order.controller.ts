import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { CreateOrderBody, UpdateOrderStatusBody } from "./order.types";
import * as orderService from "./order.service";

/* POST /api/orders */
export const createOrder: ApiHandler<EmptyParams, CreateOrderBody> = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromCart(getAuthUser(req).id, req.body?.address);
    successResponse(res, order, "Order created successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* GET /api/orders/:id */
export const getOrder: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    successResponse(res, order, "Order fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* GET /api/orders/user */
export const getUserOrders: ApiHandler = async (req, res, next) => {
  try {
    const orders = await orderService.getUserOrders(getAuthUser(req).id);
    successResponse(res, orders, "User orders fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/orders/:id/cancel */
export const cancelOrder: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, getAuthUser(req).id);
    successResponse(res, order, "Order cancelled successfully");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/orders/:id/status (admin / vendor) */
export const updateStatus: ApiHandler<IdParams, UpdateOrderStatusBody> = async (req, res, next) => {
  try {
    const status = req.body?.status;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    successResponse(res, order, `Order status updated to ${order.status}`);
  } catch (error) {
    next(error);
  }
};
