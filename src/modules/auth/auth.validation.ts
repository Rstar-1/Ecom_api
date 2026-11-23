import { AppError } from "../../utils";
import type { LoginBody, RegisterBody, ResetPasswordBody, VerifyOtpBody } from "./auth.types";

/** Validates user registration fields */
export const validateRegister = (data: Partial<RegisterBody>): void => {
  const name = data.fullname || (data as Record<string, unknown>).name;
  if (!name || typeof name !== "string" || !name.trim()) {
    throw AppError.badRequest("Full name is required");
  }
  const email = data.email?.trim();
  const mobile = data.mobile?.trim();
  if (!email && !mobile) {
    throw AppError.badRequest("Email or mobile number is required");
  }
  if (!data.password || typeof data.password !== "string" || data.password.length < 4) {
    throw AppError.badRequest("Password must be at least 4 characters long");
  }
};

/** Validates login payload */
export const validateLogin = (data: Partial<LoginBody> & { identifier?: string }): void => {
  const identifier = data.email || data.mobile || data.identifier;
  if (!identifier || typeof identifier !== "string" || !identifier.trim()) {
    throw AppError.badRequest("Email or mobile number is required");
  }
  if (!data.password || typeof data.password !== "string") {
    throw AppError.badRequest("Password is required");
  }
};

/** Validates OTP verification payload */
export const validateVerifyOtp = (data: Partial<VerifyOtpBody> & { code?: string }): void => {
  const code = data.code || data.otp;
  if (!code || typeof code !== "string" || !code.trim()) {
    throw AppError.badRequest("OTP code is required");
  }
};

/** Validates reset password payload */
export const validateResetPassword = (data: Partial<ResetPasswordBody>): void => {
  if (!data.password || typeof data.password !== "string" || data.password.length < 4) {
    throw AppError.badRequest("New password must be at least 4 characters long");
  }
};
