import bcrypt from "bcryptjs";
import { ENV } from "../../config/env.js";
import { utils, constants, models } from "../../../../../shared/index.js";

const { jwt, parseAddress, resolveRole, generateUserId } = utils;
const { messages } = constants;
const { User, Role } = models;

import { generateAndSendOtp, verifyOtp } from "../otp/otp.service.js";

/* ================= REGISTER ================= */
export const registerUser = async (data) => {
  if (!data) throw new Error("Invalid request data");

  const email = data.email?.toLowerCase().trim();
  const mobile = data.mobile?.trim();

  if (!email || !mobile) {
    throw new Error("Email and mobile are required");
  }

  if (!data.password) {
    throw new Error("Password is required");
  }

  if (!data.fullname) {
    throw new Error("Full name is required");
  }

  const exists = await User.findOne({
    $or: [{ email }, { mobile }],
    isDeleted: false,
  });

  if (exists) {
    throw new Error("User already exists with this email or mobile");
  }

  const roleDoc = await resolveRole(data);
  const id = data.id?.trim() || (await generateUserId());

  const user = await User.create({
    id,
    fullname: data.fullname.trim(),
    email,
    mobile,
    password: data.password,
    roleId: roleDoc._id,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isOtpVerified: false,
    image: data.image || "",
    address: parseAddress(data.address),
    documents: data.documents || null,
  });

  await generateAndSendOtp({
    mobile: user.mobile,
    email: user.email,
    purpose: "REGISTER",
  });

  return {
    message: "OTP sent successfully",
    id: user.id,
    mobile: user.mobile,
    email: user.email,
    contact: user.mobile || user.email,
  };
};

/* ================= VERIFY OTP ================= */
export const verifyRegisterOtp = async ({ mobile, email, otp }) => {
  if (!otp) throw new Error("OTP is required");

  await verifyOtp({ mobile, email, otp });

  const query = {
    isDeleted: false,
    ...(mobile ? { mobile } : {}),
    ...(email ? { email: email.toLowerCase().trim() } : {}),
  };

  const user = await User.findOneAndUpdate(
    query,
    {
      isOtpVerified: true,
      isActive: true,
    },
    { new: true }
  ).populate("roleId", "id rolename permissions pages");

  if (!user) throw new Error(messages.USER_NOT_FOUND);

  return {
    message: "User verified successfully",
    user,
  };
};

/* ================= LOGIN ================= */
export const loginUser = async ({ email, mobile, password }) => {
  if (!password) throw new Error("Password required");

  const query = { isDeleted: false };

  if (email || mobile) {
    query.$or = [
      email ? { email: email.toLowerCase().trim() } : null,
      mobile ? { mobile: mobile.trim() } : null,
    ].filter(Boolean);
  }

  const user = await User.findOne(query).select("+password");

  if (!user) throw new Error(messages.USER_NOT_FOUND);
  if (!user.isActive) throw new Error("Inactive user");
  if (!user.isOtpVerified) throw new Error("Verify OTP first");

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    user.loginAttempts += 1;
    await user.save();
    throw new Error(messages.INVALID_CREDENTIALS);
  }

  user.loginAttempts = 0;
  user.lastLogin = new Date();
  await user.save();

  const roleDoc = await Role.findById(user.roleId);

  const token = jwt.generateToken(
    {
      id: user._id,
      userId: user.id,
      email: user.email,
      role: roleDoc ? roleDoc.rolename : "customer",
      roleId: user.roleId,
      permissions: roleDoc ? roleDoc.permissions : [],
    },
    ENV.JWT_SECRET,
    ENV.JWT_EXPIRES_IN
  );

  return { user, token };
};

/* ================= LOGOUT ================= */
export const logoutUser = async (user) => {
  return { message: "Logout successful" };
};
