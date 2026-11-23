import { AppError } from "../../utils";
import type { UpdateUserBody } from "./user.types";

/** Validates user profile/admin update payload */
export const validateUpdateUser = (data: Partial<UpdateUserBody>): void => {
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email.trim())) {
    throw AppError.badRequest("Invalid email address format");
  }
  if (data.password && typeof data.password === "string" && data.password.length < 4) {
    throw AppError.badRequest("Password must be at least 4 characters long");
  }
};
