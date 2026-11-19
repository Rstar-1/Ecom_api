import type { Response } from "express";
import { HTTP_STATUS, messages } from "../constants";
import type { ApiResponse } from "../types/http";

export const successResponse = <T>(
  res: Response<ApiResponse>,
  data: T,
  message: string = messages.SUCCESS,
  status: number = HTTP_STATUS.OK
): void => {
  res.status(status).json({ success: true, message, data });
};

export const errorResponse = (
  res: Response<ApiResponse>,
  message: string = messages.INTERNAL_SERVER_ERROR,
  status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  errors?: unknown[]
): void => {
  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};
