import { fileUrl } from "../../middlewares";
import type { ApiHandler, EmptyParams } from "../../types/http";
import { successResponse } from "../../utils";
import type {
  ContactBody,
  LoginBody,
  RegisterBody,
  RegisterFiles,
  ResetPasswordBody,
  VerifyOtpBody,
} from "./auth.types";
import * as service from "./auth.service";

/* POST /api/auth/register (JSON or multipart with image / gstCertificate / panCard / shopPhoto) */
export const register: ApiHandler<EmptyParams, RegisterBody> = async (req, res, next) => {
  try {
    const body: RegisterBody = { ...(req.body ?? {}) };
    const files = req.files as RegisterFiles | undefined;

    const image = fileUrl(files?.image?.[0]);
    if (image) body.image = image;

    const documents = {
      gstCertificate: fileUrl(files?.gstCertificate?.[0]),
      panCard: fileUrl(files?.panCard?.[0]),
      shopPhoto: fileUrl(files?.shopPhoto?.[0]),
    };
    if (Object.values(documents).some(Boolean)) body.documents = documents;

    const data = await service.registerUser(body, req.user);
    successResponse(res, data, data.message);
  } catch (error) {
    next(error);
  }
};

/* POST /api/auth/verify-otp */
export const verifyOtp: ApiHandler<EmptyParams, VerifyOtpBody> = async (req, res, next) => {
  try {
    const data = await service.verifyRegisterOtp(req.body ?? {});
    successResponse(res, data, "Verified");
  } catch (error) {
    next(error);
  }
};

/* POST /api/auth/login */
export const login: ApiHandler<EmptyParams, LoginBody> = async (req, res, next) => {
  try {
    const data = await service.loginUser(req.body ?? {});
    successResponse(res, data, "Login successful");
  } catch (error) {
    next(error);
  }
};

/* POST /api/auth/logout */
export const logout: ApiHandler = async (_req, res, next) => {
  try {
    const data = await service.logoutUser();
    successResponse(res, data, "Logout successful");
  } catch (error) {
    next(error);
  }
};

/* POST /api/auth/forgot-password */
export const forgotPassword: ApiHandler<EmptyParams, ContactBody> = async (req, res, next) => {
  try {
    const data = await service.forgotPassword(req.body ?? {});
    successResponse(res, data, "OTP sent successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/auth/verify-forgot-otp */
export const verifyForgotPasswordOtp: ApiHandler<EmptyParams, VerifyOtpBody> = async (req, res, next) => {
  try {
    const data = await service.verifyForgotPasswordOtp(req.body ?? {});
    successResponse(res, data, "OTP verified successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/auth/reset-password */
export const resetPassword: ApiHandler<EmptyParams, ResetPasswordBody> = async (req, res, next) => {
  try {
    const data = await service.resetPassword(req.body ?? {}, req.user?.id);
    successResponse(res, data, "Password reset successfully");
  } catch (error) {
    next(error);
  }
};

/* GET /api/auth/test00 */
export const test: ApiHandler = async (_req, res, next) => {
  try {
    successResponse(res, "data", "Test successful");
  } catch (error) {
    next(error);
  }
};
