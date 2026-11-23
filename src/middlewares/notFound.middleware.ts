import type { Request, Response } from "express";
import { HTTP_STATUS } from "../constants";
import type { ApiResponse } from "../types/http";
import { errorResponse } from "../utils/response";

/** Handles unmatched 404 routes */
export const notFoundMiddleware = (_req: Request, res: Response<ApiResponse>): void => {
  errorResponse(res, "Route not found", HTTP_STATUS.NOT_FOUND);
};

export const notFoundHandler = notFoundMiddleware;
export default notFoundMiddleware;
