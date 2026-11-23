import { AppError } from "../../utils";
import type { ProductBody } from "./product.types";

/** Validates product create / update fields */
export const validateProduct = (data: Partial<ProductBody> & { name?: string }): void => {
  const name = data.productName || data.name;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw AppError.badRequest("Product name is required");
  }
  if (data.price !== undefined && (isNaN(Number(data.price)) || Number(data.price) < 0)) {
    throw AppError.badRequest("Valid price is required");
  }
};
