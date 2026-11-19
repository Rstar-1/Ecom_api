import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

/* ================= RESPONSE SHAPES ================= */
export interface ApiSuccess<T = unknown> {
  success: true;
  message: string;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: unknown[];
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure;

/* ================= REQUEST HELPERS ================= */
/* Defaults match Express' own so handlers compose with other middleware in a route */
export type EmptyParams = ParamsDictionary;
export type EmptyBody = unknown;
export type EmptyQuery = ParsedQs;

export interface IdParams extends ParamsDictionary {
  id: string;
}

/**
 * Typed Express handler used by every controller.
 * P = route params, B = request body, Q = query string.
 */
export type ApiHandler<P = EmptyParams, B = EmptyBody, Q = EmptyQuery> = RequestHandler<
  P,
  ApiResponse,
  B,
  Q
>;
