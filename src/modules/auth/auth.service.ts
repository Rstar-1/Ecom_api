import bcrypt from "bcryptjs";
import { ENV } from "../../config/env";
import { messages, PERMISSIONS, roles } from "../../constants";
import { hasPermission } from "../../middlewares";
import { Otp, Role, User } from "../../models";
import type { AuthUser } from "../../types/express";
import { AppError, isObjectId, jwt, parseAddress, str, toBool } from "../../utils";
import { PUBLIC_SIGNUP_ROLES, resolveRole, userWithRole } from "../roles/role.helpers";
import type { ContactBody, LoginBody, RegisterBody, ResetPasswordBody, VerifyOtpBody } from "./auth.types";
import { generateAndSendOtp, verifyOtp } from "./otp.service";

const normalizeContact = ({ email, mobile }: ContactBody) => ({
  email: email ? str(email).toLowerCase() : undefined,
  mobile: mobile ? str(mobile) : undefined,
});

/** `$or` filter from whichever identifiers were provided. */
const contactOr = ({ email, mobile }: ContactBody) => {
  const or: Array<{ email: string } | { mobile: string }> = [];
  if (email) or.push({ email });
  if (mobile) or.push({ mobile });
  return or;
};

/* ================= REGISTER ================= */
/**
 * Public sign-up: customer/vendor role only, OTP verification required.
 * An authenticated admin (or USER_CREATE permission) may pick any role and
 * pre-verify / activate the account (dashboard "Add user").
 */
export const registerUser = async (data: RegisterBody, requester?: AuthUser) => {
  const { email, mobile } = normalizeContact(data);
  if (!email && !mobile) throw AppError.badRequest("Email or mobile is required");
  if (!data.password) throw AppError.badRequest("Password is required");
  if (!str(data.fullname)) throw AppError.badRequest("Full name is required");

  const queryOr = contactOr({ email, mobile });
  if (queryOr.length > 0) {
    const exists = await User.exists({ $or: queryOr, isDeleted: false });
    if (exists) throw AppError.conflict("User already exists with this email or mobile");
  }

  const privileged = !!requester && hasPermission(requester, [PERMISSIONS.USER_CREATE]);
  const roleDoc = await resolveRole(data, privileged ? undefined : PUBLIC_SIGNUP_ROLES);
  const isOtpVerified = privileged && data.isOtpVerified !== undefined ? toBool(data.isOtpVerified) : false;

  const user = await User.create({
    ...(privileged && str(data.id) ? { id: str(data.id) } : {}),
    fullname: str(data.fullname),
    email: email || undefined,
    mobile: mobile || undefined,
    password: data.password,
    roleId: roleDoc._id,
    role: roleDoc.rolename,
    isActive: privileged && data.isActive !== undefined ? toBool(data.isActive) : true,
    isOtpVerified,
    image: data.image ?? "",
    address: parseAddress(data.address),
    documents: data.documents ?? null,
  });

  await Role.updateOne({ _id: roleDoc._id }, { $inc: { count: 1 } });

  if (!isOtpVerified) {
    await generateAndSendOtp({ mobile: user.mobile, email: user.email, purpose: "REGISTER" });
    return {
      message: "OTP sent successfully",
      id: user.id,
      mobile: user.mobile,
      email: user.email,
      contact: user.mobile || user.email,
    };
  }

  return {
    message: "User registered successfully",
    id: user.id,
    mobile: user.mobile,
    email: user.email,
    user: userWithRole(user, roleDoc),
  };
};

/* ================= VERIFY REGISTER OTP ================= */
export const verifyRegisterOtp = async (body: VerifyOtpBody) => {
  if (!body.otp) throw AppError.badRequest("OTP is required");
  const { email, mobile } = normalizeContact(body);

  await verifyOtp({ mobile, email, otp: body.otp });

  const user = await User.findOneAndUpdate(
    { isDeleted: false, ...(mobile ? { mobile } : {}), ...(email ? { email } : {}) },
    { isOtpVerified: true, isActive: true },
    { new: true }
  );
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);

  const roleDoc = await Role.findById(user.roleId);
  return { message: "User verified successfully", user: userWithRole(user, roleDoc) };
};

/* ================= LOGIN ================= */
export const loginUser = async (body: LoginBody) => {
  if (!body.password) throw AppError.badRequest("Password required");

  const or = contactOr(normalizeContact(body));
  if (or.length === 0) throw AppError.badRequest("Email or mobile is required");

  const user = await User.findOne({ isDeleted: false, $or: or }).select("+password");
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);
  if (!user.isActive) throw AppError.forbidden("Inactive user");
  if (!user.isOtpVerified) throw AppError.forbidden("Verify OTP first");

  const match = await bcrypt.compare(body.password, user.password);
  if (!match) {
    user.loginAttempts = (user.loginAttempts ?? 0) + 1;
    await user.save();
    throw AppError.unauthorized(messages.INVALID_CREDENTIALS);
  }

  user.loginAttempts = 0;
  user.lastLogin = new Date();
  await user.save();

  let roleDoc = user.roleId && isObjectId(user.roleId)
    ? await Role.findOne({ _id: user.roleId, isDeleted: false })
    : null;
  if (!roleDoc) {
    const roleName = (user.role || roles.CUSTOMER).toLowerCase();
    roleDoc = await Role.findOne({
      $or: [{ rolename: roleName }, { name: roleName }],
      isDeleted: false,
    });
  }
  const summary = userWithRole(user, roleDoc);

  const token = jwt.generateToken(
    {
      id: user._id.toString(),
      userId: user.id,
      email: user.email || undefined,
      role: summary.role,
      roleId: (roleDoc?._id ?? user.roleId ?? "").toString(),
      permissions: summary.permissions,
      pages: summary.pages,
    },
    ENV.JWT_SECRET,
    ENV.JWT_EXPIRES_IN
  );

  return { user: summary, token };
};

/* ================= LOGOUT ================= */
export const logoutUser = async () => ({ message: "Logout successful" });

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (body: ContactBody) => {
  const or = contactOr(normalizeContact(body));
  if (or.length === 0) throw AppError.badRequest("Email or mobile is required");

  const user = await User.findOne({ isDeleted: false, $or: or });
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);

  await generateAndSendOtp({ mobile: user.mobile, email: user.email, purpose: "FORGOT_PASSWORD" });

  return {
    message: "OTP sent successfully",
    mobile: user.mobile,
    email: user.email,
    contact: user.mobile || user.email,
  };
};

/* ================= VERIFY FORGOT PASSWORD OTP ================= */
export const verifyForgotPasswordOtp = async (body: VerifyOtpBody) => {
  if (!body.otp) throw AppError.badRequest("OTP is required");
  const { email, mobile } = normalizeContact(body);
  await verifyOtp({ mobile, email, otp: body.otp, purpose: "FORGOT_PASSWORD" });
  return { message: "OTP verified successfully" };
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (body: ResetPasswordBody) => {
  if (!body.password) throw AppError.badRequest("New password is required");
  const { email, mobile } = normalizeContact(body);
  if (!email && !mobile) throw AppError.badRequest("Email or mobile is required");

  const contact = { ...(mobile ? { mobile } : {}), ...(email ? { email } : {}) };

  const otpRecord = await Otp.findOne({
    purpose: "FORGOT_PASSWORD",
    isVerified: true,
    expiresAt: { $gt: new Date() },
    ...contact,
  });
  if (!otpRecord) throw AppError.badRequest("OTP verification required or OTP expired");

  const user = await User.findOne({ isDeleted: false, ...contact });
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);

  user.password = body.password; // hashed by pre-save hook
  await user.save();
  await Otp.deleteOne({ _id: otpRecord._id });

  return { message: "Password reset successfully" };
};
