import bcrypt from "bcryptjs";
import { ENV } from "../../config/env";
import { messages, PERMISSIONS, roles } from "../../constants";
import { hasPermission } from "../../middlewares";
import { Otp } from "./auth.model";
import { Role } from "../roles/role.model";
import { User } from "../users/user.model";
import type { AuthUser } from "../../types/express";
import { AppError, isObjectId, jwt, parseAddress, parseSocial, str, toBool } from "../../utils";
import { resolveRole, userWithRole } from "../roles/role.helpers";
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
export const registerUser = async (data: RegisterBody, requester?: AuthUser) => {
  const fullname = str(data.fullname || (data as any).fullName || (data as any).name || (data as any).username || (data as any).userName);
  const emailInput = (data.email || (data as any).userEmail || (data as any).emailId);
  const mobileInput = (data.mobile || (data as any).phone || (data as any).phoneNumber || (data as any).contact);
  const email = emailInput ? str(emailInput).toLowerCase() : undefined;
  const mobile = mobileInput ? str(mobileInput) : undefined;
  const password = str(data.password || (data as any).pass);

  if (!email && !mobile) throw AppError.badRequest("Email or mobile is required");
  if (!password) throw AppError.badRequest("Password is required");
  if (!fullname) throw AppError.badRequest("Full name is required");

  const queryOr = contactOr({ email, mobile });
  if (queryOr.length > 0) {
    const existing = await User.findOne({ $or: queryOr, isDeleted: false });
    if (existing) {
      if (existing.isOtpVerified) {
        throw AppError.conflict("User already exists with this email or mobile");
      }
      // If user registered but hasn't verified OTP yet, update credentials and re-send OTP
      existing.fullname = fullname;
      existing.password = password;
      if (email) existing.email = email;
      if (mobile) existing.mobile = mobile;
      await existing.save();
      await generateAndSendOtp({ mobile: existing.mobile, email: existing.email, purpose: "REGISTER" });
      return {
        message: "OTP sent successfully",
        id: existing.id,
        mobile: existing.mobile,
        email: existing.email,
        contact: existing.mobile || existing.email,
      };
    }
  }

  const roleDoc = await resolveRole(data);
  const privileged = !!requester && hasPermission(requester, [PERMISSIONS.USER_CREATE]);
  const isOtpVerified = privileged && data.isOtpVerified !== undefined ? toBool(data.isOtpVerified) : false;
  const validRoleId = roleDoc?._id && isObjectId(roleDoc._id.toString()) ? roleDoc._id : undefined;

  const user = await User.create({
    ...(privileged && str(data.id) ? { id: str(data.id) } : {}),
    fullname,
    email: email || undefined,
    mobile: mobile || undefined,
    password,
    roleId: validRoleId,
    role: roleDoc?.rolename || "customer",
    isActive: privileged && data.isActive !== undefined ? toBool(data.isActive) : true,
    isOtpVerified,
    image: data.image ?? "",
    address: parseAddress(data.address),
    social: parseSocial(data.social),
    documents: data.documents ?? null,
  });

  if (roleDoc?._id) {
    await Role.updateOne({ _id: roleDoc._id }, { $inc: { count: 1 } });
  }

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
export const resetPassword = async (
  body: ResetPasswordBody & { id?: string; userId?: string; currentPassword?: string },
  authUserId?: string
) => {
  if (!body.password) throw AppError.badRequest("New password is required");

  const targetId = authUserId || body.id || body.userId;
  if (targetId) {
    const idFilter = isObjectId(targetId) ? { _id: targetId } : { id: targetId };
    const user = await User.findOne({ ...idFilter, isDeleted: false }).select("+password");
    if (user) {
      if (!body.currentPassword) {
        throw AppError.badRequest("Current password is required");
      }
      if (!user.password) {
        throw AppError.badRequest("User password not set");
      }
      const isMatch = await bcrypt.compare(body.currentPassword, user.password);
      if (!isMatch) {
        throw AppError.badRequest("Current password does not match");
      }
      user.password = body.password; // hashed by pre-save hook
      await user.save();
      return { message: "Password updated successfully" };
    }
  }

  const { email, mobile } = normalizeContact(body);
  if (!email && !mobile) throw AppError.badRequest("Email or mobile is required");

  const contact = { ...(mobile ? { mobile } : {}), ...(email ? { email } : {}) };

  const otpRecord = await Otp.findOne({
    purpose: "FORGOT_PASSWORD",
    isVerified: true,
    expiresAt: { $gt: new Date() },
    ...contact,
  });
  if (!otpRecord) {
    const user = await User.findOne({ isDeleted: false, ...contact }).select("+password");
    if (user) {
      if (!body.currentPassword) {
        throw AppError.badRequest("Current password or OTP verification is required");
      }
      if (!user.password) {
        throw AppError.badRequest("User password not set");
      }
      const isMatch = await bcrypt.compare(body.currentPassword, user.password);
      if (!isMatch) {
        throw AppError.badRequest("Current password does not match");
      }
      user.password = body.password; // hashed by pre-save hook
      await user.save();
      return { message: "Password updated successfully" };
    }
    throw AppError.badRequest("OTP verification required or OTP expired");
  }

  const user = await User.findOne({ isDeleted: false, ...contact });
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);

  user.password = body.password; // hashed by pre-save hook
  await user.save();
  await Otp.deleteOne({ _id: otpRecord._id });

  return { message: "Password reset successfully" };
};
