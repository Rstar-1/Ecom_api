import bcrypt from "bcryptjs";
import { ENV } from "../../config/env.js";
import { utils, constants, models } from "../../../../../shared/index.js";

const { asyncHandler, successResponse, jwt, parseAddress, validateRole, mergeObjects } = utils;
const { roles, messages } = constants;
const { User, Role } = models;

import { generateAndSendOtp, verifyOtp } from "../otp/otp.service.js";

/* ================= REGISTER ================= */
export const registerUser = async (data) => {
  if (!data) throw new Error("Invalid request data");

  /* ================= NORMALIZE INPUT ================= */
  const email = data.email?.toLowerCase().trim();
  const mobile = data.mobile?.trim();

  if (!email && !mobile) {
    throw new Error("Email or mobile is required");
  }

  if (!data.password) {
    throw new Error("Password is required");
  }

  if (!data.fullname) {
    throw new Error("Full name is required");
  }

  /* ================= CHECK EXIST ================= */
  const exists = await User.findOne({
    $or: [
      email ? { email } : null,
      mobile ? { mobile } : null,
    ].filter(Boolean),
  });

  if (exists) {
    throw new Error("User already exists");
  }

  /* ================= ROLE ================= */
  const role = data.role ? await validateRole(data.role) : roles.USER;

  /* ================= SAFE PARSING ================= */
  let address = [];
  let shopDetails = null;
  let documents = null;

  try {
    address = parseAddress(
      typeof data.address === "string"
        ? JSON.parse(data.address)
        : data.address || []
    );
  } catch {
    address = [];
  }

  try {
    shopDetails =
      typeof data.shopDetails === "string"
        ? JSON.parse(data.shopDetails)
        : data.shopDetails || null;
  } catch {
    shopDetails = null;
  }

  try {
    documents =
      typeof data.documents === "string"
        ? JSON.parse(data.documents)
        : data.documents || null;
  } catch {
    documents = null;
  }

  /* ================= CLEAN EMPTY OBJECTS ================= */
  if (shopDetails && Object.values(shopDetails).every((v) => !v)) {
    shopDetails = null;
  }

  if (documents && Object.values(documents).every((v) => !v)) {
    documents = null;
  }

  /* ================= CREATE USER ================= */
  const user = await User.create({
    fullname: data.fullname.trim(),
    email: email || undefined,
    mobile: mobile || undefined,
    password: data.password,
    role,
    status: false,
    isOtpVerified: false,
    image: data.image || "",
    address,
    shopDetails,
    documents,
  });

  /* ================= SEND OTP ================= */
  await generateAndSendOtp({
    mobile: user.mobile,
    email: user.email,
    purpose: "REGISTER",
  });

  /* ================= RESPONSE ================= */
  return {
    message: "OTP sent successfully",
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
    ...(email ? { email } : {}),
  };

  const user = await User.findOneAndUpdate(
    query,
    {
      isOtpVerified: true,
      status: true,
    },
    { new: true }
  );

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
      email ? { email } : null,
      mobile ? { mobile } : null,
    ].filter(Boolean);
  }

  const user = await User.findOne(query).select("+password");

  if (!user) throw new Error(messages.USER_NOT_FOUND);
  if (!user.status) throw new Error("Inactive user");
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

  const roleDoc = await Role.findOne({ name: user.role });

  const token = jwt.generateToken(
    {
      id: user._id,
      email: user.email,
      role: user.role,
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