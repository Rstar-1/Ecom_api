import type { ApiHandler, EmptyParams } from "../../types/http";
import { successResponse } from "../../utils";
import type { LoginBody, RegisterBody, VerifyOtpBody } from "./auth.types";
import * as service from "./auth.service";

/* POST /api/auth/register */
export const register: ApiHandler<EmptyParams, RegisterBody> = async (req, res, next) => {
  try {
    const data = await service.registerUser(req.body ?? {});
    successResponse(res, data, "OTP sent");
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
