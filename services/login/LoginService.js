import Auth from "../../models/login/LoginSchema.js";
import Log from "../../models/log/LogSchema.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const ROLES = ["user", "marketing", "vendor", "admin"];

// ================= HELPERS =================
const parseAddress = (address) => {
  if (!address) return [];
  if (typeof address === "string") {
    try {
      return JSON.parse(address);
    } catch {
      return [];
    }
  }
  return address;
};

const validRole = (role) => (ROLES.includes(role) ? role : "user");

const buildSearchFilter = (search = "") => {
  if (!search) return {};
  const term = search.trim();

  return {
    $or: [
      { fullname: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
      { mobileno: { $regex: term, $options: "i" } },
      { role: { $regex: term, $options: "i" } },

      ...(term.toLowerCase() === "active"
        ? [{ status: true }]
        : term.toLowerCase() === "inactive"
        ? [{ status: false }]
        : []),

      { "address.street": { $regex: term, $options: "i" } },
      { "address.city": { $regex: term, $options: "i" } },
      { "address.state": { $regex: term, $options: "i" } },
      { "address.country": { $regex: term, $options: "i" } },
      { "address.pincode": { $regex: term, $options: "i" } },
    ],
  };
};

const logEvent = async (title, status, message, userId) => {
  await Log.create({
    title,
    status,
    message,
    userId: userId || new mongoose.Types.ObjectId(),
  });
};

// ================= GET USERS =================
export const getUsers = async ({ page = 1, limit = 10, search = "" }) => {
  try {
    page = Math.max(1, +page || 1);
    limit = Math.max(1, +limit || 10);

    const filter = buildSearchFilter(search);

    const [total, users] = await Promise.all([
      Auth.countDocuments(filter),
      Auth.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return {
      data: users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

// ================= REGISTER =================
export const register = async (req) => {
  let userId;

  try {
    const { fullname, email, mobileno, password, role, status } = req.body;

    if (await Auth.findOne({ email })) {
      throw new Error("Email already exists");
    }

    const newUser = await Auth.create({
      fullname,
      email,
      mobileno,
      password: await bcrypt.hash(password, 10),
      image: req.body.image || req.body.picture || "",
      address: parseAddress(req.body.address),
      role: validRole(role),
      status: status ?? true,
    });

    userId = newUser._id;

    await logEvent(
      newUser.fullname,
      "SUCCESS",
      `User registered: ${userId}`,
      userId
    );

    return newUser;
  } catch (error) {
    await logEvent("Register User", "FAILURE", error.message, userId);
    throw error;
  }
};

// ================= UPDATE USER =================
export const updateUser = async (id, data) => {
  let userId = id;

  try {
    const updateData = {
      ...data,
      ...(data.image || data.picture
        ? { image: data.image || data.picture }
        : {}),
      ...(data.password
        ? { password: await bcrypt.hash(data.password, 10) }
        : {}),
      ...(data.role ? { role: validRole(data.role) } : {}),
      ...(data.address ? { address: parseAddress(data.address) } : {}),
    };

    const user = await Auth.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) throw new Error("User not found");

    await logEvent(
      user.fullname,
      "SUCCESS",
      `User updated: ${user._id}`,
      user._id
    );

    return user;
  } catch (error) {
    await logEvent("Update User", "FAILURE", error.message, userId);
    throw error;
  }
};

// ================= LOGIN =================
export const login = async ({ email, password }) => {
  let userId;

  try {
    const user = await Auth.findOne({ email }).select("+password");
    if (!user) throw new Error("User not found");
    if (!user.status) throw new Error("User inactive");

    userId = user._id;

    if (!(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid credentials");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    user.password = undefined;

    await logEvent(
      user.fullname,
      "SUCCESS",
      `User login: ${userId}`,
      userId
    );

    return { user, token };
  } catch (error) {
    await logEvent("Login User", "FAILURE", error.message, userId);
    throw error;
  }
};

// ================= LOGOUT =================
export const logout = async (user) => {
  let userId;

  try {
    userId = user?._id || new mongoose.Types.ObjectId();

    await logEvent(
      user?.fullname || "Unknown User",
      "SUCCESS",
      `User logout: ${userId} (${user?.email || "no-email"})`,
      userId
    );

    return { message: "Logout successful" };
  } catch (error) {
    await logEvent("Logout User", "FAILURE", error.message, userId);
    throw error;
  }
};