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

const validRole = (role) => (ROLES.includes(role) ? role : "user");

// ✅ UPDATED LOG EVENT
const logEvent = async (
  title,
  status,
  message,
  userId,
  category = "AUTH",
  updatedFields = [],
) => {
  await Log.create({
    title,
    status,
    message,
    userId: userId || new mongoose.Types.ObjectId(),
    category,
    updatedFields,
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
      password,
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
      userId,
      "AUTH_REGISTER",
    );

    return newUser;
  } catch (error) {
    await logEvent(
      "Register User",
      "FAILURE",
      error.message,
      userId,
      "AUTH_REGISTER",
    );
    throw error;
  }
};

// ================= UPDATE USER =================
export const updateUser = async (id, data) => {
  let userId = id;

  try {
    // 1️⃣ Fetch existing user
    const existingUser = await Auth.findById(id).lean();
    if (!existingUser) throw new Error("User not found");

    const updateData = {};

    // 2️⃣ Compare & update only changed fields

    if (data.fullname && data.fullname !== existingUser.fullname) {
      updateData.fullname = data.fullname;
    }

    if (data.email && data.email !== existingUser.email) {
      updateData.email = data.email;
    }

    if (data.mobileno && data.mobileno !== existingUser.mobileno) {
      updateData.mobileno = data.mobileno;
    }

    if (data.role) {
      const role = validRole(data.role);
      if (role !== existingUser.role) {
        updateData.role = role;
      }
    }

    // ✅ FIXED STATUS COMPARISON (handles string/boolean)
    if (data.status !== undefined) {
      const newStatus =
        typeof data.status === "string"
          ? data.status === "true"
          : data.status;

      if (newStatus !== existingUser.status) {
        updateData.status = newStatus;
      }
    }

    if (data.address) {
      const parsedAddress = parseAddress(data.address);
      if (
        JSON.stringify(parsedAddress) !==
        JSON.stringify(existingUser.address)
      ) {
        updateData.address = parsedAddress;
      }
    }

    // ✅ Image update (supports image + picture)
    const newImage = data.image || data.picture;
    if (newImage && newImage !== existingUser.image) {
      updateData.image = newImage;
    }

    // ✅ Password update (only if provided)
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // 3️⃣ Get updated fields list for logging
    const updatedFields = Object.keys(updateData);

    // 🚫 Optional: Skip DB call if nothing changed
    if (updatedFields.length === 0) {
      return existingUser;
    }

    // 4️⃣ Update user in DB
    const user = await Auth.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) throw new Error("User not found after update");

    // 5️⃣ Log success
    await logEvent(
      user.fullname,
      "SUCCESS",
      `User updated: ${user._id}`,
      user._id,
      "USER_UPDATE",
      updatedFields
    );

    return user;
  } catch (error) {
    // 6️⃣ Log failure
    await logEvent(
      "Update User",
      "FAILURE",
      error.message,
      userId,
      "USER_UPDATE"
    );
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
      { expiresIn: "1d" },
    );

    user.password = undefined;

    await logEvent(
      user.fullname,
      "SUCCESS",
      `User login: ${userId}`,
      userId,
      "AUTH_LOGIN",
    );

    return { user, token };
  } catch (error) {
    await logEvent(
      "Login User",
      "FAILURE",
      error.message,
      userId,
      "AUTH_LOGIN",
    );
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
      `User logout: ${userId}`,
      userId,
      "AUTH_LOGOUT",
    );

    return { message: "Logout successful" };
  } catch (error) {
    await logEvent(
      "Logout User",
      "FAILURE",
      error.message,
      userId,
      "AUTH_LOGOUT",
    );
    throw error;
  }
};
