import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { MulterError } from "multer";
import { HTTP_STATUS, messages } from "../constants";
import type { ApiResponse } from "../types/http";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/response";
import { FILE_TYPE_ERROR } from "./upload.middleware";

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

interface HttpLikeError extends Error {
  status?: number;
  statusCode?: number;
}

/** Converts any thrown value into an HTTP status + message. */
const toHttpError = (err: unknown): { status: number; message: string; errors?: unknown[] } => {
  if (err instanceof AppError) {
    return { status: err.statusCode, message: err.message };
  }
  if (err instanceof MulterError || (err instanceof Error && err.message === FILE_TYPE_ERROR)) {
    return { status: HTTP_STATUS.BAD_REQUEST, message: err.message };
  }
  if (err instanceof mongoose.Error.CastError) {
    return { status: HTTP_STATUS.BAD_REQUEST, message: `Invalid ${err.path}: ${String(err.value)}` };
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return { status: HTTP_STATUS.BAD_REQUEST, message: messages.INVALID_INPUT, errors };
  }
  if (err instanceof Error && (err as MongoServerError).code === 11000) {
    const fields = Object.keys((err as MongoServerError).keyValue ?? {}).join(", ");
    return { status: HTTP_STATUS.CONFLICT, message: `Duplicate value for: ${fields || "unique field"}` };
  }
  if (err instanceof Error) {
    // e.g. body-parser errors (invalid JSON) carry `status`
    const httpErr = err as HttpLikeError;
    return {
      status: httpErr.statusCode ?? httpErr.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message: err.message || messages.INTERNAL_SERVER_ERROR,
    };
  }
  return { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: messages.INTERNAL_SERVER_ERROR };
};

export { notFoundHandler, notFoundMiddleware } from "./notFound.middleware";

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const { status, message, errors } = toHttpError(err);
  if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) console.error("❌ Error:", err);

  errorResponse(res, message, status, errors);
};
