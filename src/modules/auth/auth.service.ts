import bcrypt from "bcryptjs";
import { ENV } from "../../config/env";
import { messages, roles } from "../../constants";
import { Role, User, type ShopDetails, type UserDocument, type UserDocuments } from "../../models";
import { AppError, jwt, parseAddress, parseJsonObject, validateRole } from "../../utils";
import type { LoginBody, RegisterBody, VerifyOtpBody } from "./auth.types";
import { generateAndSendOtp, verifyOtp } from "./otp.service";

export interface RegisterResult {
  message: string;
  mobile?: string | null;
  email?: string | null;
  contact?: string | null;
}

export interface VerifyResult {
  message: string;
  user: UserDocument;
}

export interface LoginResult {
  user: UserDocument;
  token: string;
}

const isEmptyObject = (obj: object | null): boolean => !!obj && Object.values(obj).every((v) => !v);

/** Builds an `$or` filter from whichever identifiers were provided. */
const contactFilter = (email?: string, mobile?: string) => {
  const or: Array<{ email: string } | { mobile: string }> = [];
  if (email) or.push({ email });
  if (mobile) or.push({ mobile });
  return or;
};

/* ================= REGISTER ================= */
export const registerUser = async (data: RegisterBody): Promise<RegisterResult> => {
  const email = data.email?.toLowerCase().trim();
  const mobile = data.mobile?.trim();

  if (!email && !mobile) throw AppError.badRequest("Email or mobile is required");
  if (!data.password) throw AppError.badRequest("Password is required");
  if (!data.fullname?.trim()) throw AppError.badRequest("Full name is required");

  const exists = await User.exists({ $or: contactFilter(email, mobile) });
  if (exists) throw AppError.conflict("User already exists");

  const role = data.role ? await validateRole(data.role) : roles.USER;

  let shopDetails = parseJsonObject<ShopDetails>(data.shopDetails);
  let documents = parseJsonObject<UserDocuments>(data.documents);
  if (isEmptyObject(shopDetails)) shopDetails = null;
  if (isEmptyObject(documents)) documents = null;

  const user = await User.create({
    fullname: data.fullname.trim(),
    email: email || undefined,
    mobile: mobile || undefined,
    password: data.password,
    role,
    status: false,
    isOtpVerified: false,
    image: data.image ?? "",
    address: parseAddress(data.address),
    shopDetails,
    documents,
  });

  await generateAndSendOtp({ mobile: user.mobile, email: user.email, purpose: "REGISTER" });

  return {
    message: "OTP sent successfully",
    mobile: user.mobile,
    email: user.email,
    contact: user.mobile ?? user.email,
  };
};

/* ================= VERIFY OTP ================= */
export const verifyRegisterOtp = async ({ mobile, email, otp }: VerifyOtpBody): Promise<VerifyResult> => {
  if (!otp) throw AppError.badRequest("OTP is required");

  await verifyOtp({ mobile, email, otp });

  const user = await User.findOneAndUpdate(
    {
      isDeleted: false,
      ...(mobile ? { mobile } : {}),
      ...(email ? { email: email.toLowerCase().trim() } : {}),
    },
    { isOtpVerified: true, status: true },
    { new: true }
  );

  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);

  return { message: "User verified successfully", user };
};

/* ================= LOGIN ================= */
export const loginUser = async ({ email, mobile, password }: LoginBody): Promise<LoginResult> => {
  if (!password) throw AppError.badRequest("Password required");

  const or = contactFilter(email?.toLowerCase().trim(), mobile?.trim());
  if (or.length === 0) throw AppError.badRequest("Email or mobile is required");

  const user = await User.findOne({ isDeleted: false, $or: or }).select("+password");

  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);
  if (!user.status) throw AppError.forbidden("Inactive user");
  if (!user.isOtpVerified) throw AppError.forbidden("Verify OTP first");

  const match = await bcrypt.compare(password, user.password ?? "");
  if (!match) {
    user.loginAttempts = (user.loginAttempts ?? 0) + 1;
    await user.save();
    throw AppError.unauthorized(messages.INVALID_CREDENTIALS);
  }

  user.loginAttempts = 0;
  user.lastLogin = new Date();
  await user.save();

  const roleDoc = await Role.findOne({ name: user.role }).lean();

  const token = jwt.generateToken(
    {
      id: user._id.toString(),
      ...(user.email ? { email: user.email } : {}),
      role: user.role,
      permissions: roleDoc?.permissions ?? [],
    },
    ENV.JWT_SECRET,
    ENV.JWT_EXPIRES_IN
  );

  return { user, token };
};

/* ================= LOGOUT ================= */
export const logoutUser = async (): Promise<{ message: string }> => ({ message: "Logout successful" });
