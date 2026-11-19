import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { CodPaymentBody, CreatePaymentOrderBody, VerifyPaymentBody } from "./payment.types";
import * as paymentService from "./payment.service";

/* POST /api/payments/create-order */
export const createOrder: ApiHandler<EmptyParams, CreatePaymentOrderBody> = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body ?? {};
    const razorpayOrder = await paymentService.createRazorpayOrder(getAuthUser(req).id, orderId, amount);
    successResponse(res, razorpayOrder, "Razorpay order created");
  } catch (error) {
    next(error);
  }
};

/* POST /api/payments/verify */
export const verifyPayment: ApiHandler<EmptyParams, VerifyPaymentBody> = async (req, res, next) => {
  try {
    const result = await paymentService.verifyPayment(req.body ?? {});
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/* POST /api/payments/cod */
export const handleCod: ApiHandler<EmptyParams, CodPaymentBody> = async (req, res, next) => {
  try {
    const { orderId, amount } = req.body ?? {};
    const result = await paymentService.handleCodPayment(getAuthUser(req).id, orderId, amount);
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/* GET /api/payments/:id */
export const getPayment: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id);
    successResponse(res, payment, "Payment details fetched");
  } catch (error) {
    next(error);
  }
};
