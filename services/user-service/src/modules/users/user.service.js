import mongoose from "mongoose";
import { utils, constants, models } from "../../../../../shared/index.js";

const { messages } = constants;
const { User, Role } = models;
const { parseAddress, mergeObjects, resolveRole, buildUserQuery } = utils;

/* ================= GET ALL USERS ================= */
export const getUsers = async (query = {}) => {
  const { roleId, role, rolename, isActive, search, page = 1, limit = 20, isDeleted } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") {
      filter.isDeleted = isDeleted === "true" || isDeleted === true;
    }
  } else {
    filter.isDeleted = false;
  }

  const roleTerm = String(roleId || role || rolename || "").trim();
  if (roleTerm && roleTerm !== "all") {
    let targetRoleId = null;
    if (mongoose.Types.ObjectId.isValid(roleTerm)) {
      targetRoleId = new mongoose.Types.ObjectId(roleTerm);
    } else {
      const roleDoc = await Role.findOne({
        $or: [
          { rolename: new RegExp(`^${roleTerm}$`, "i") },
          { id: roleTerm },
        ],
      });
      if (roleDoc) {
        targetRoleId = roleDoc._id;
      }
    }
    if (targetRoleId) {
      filter.roleId = targetRoleId;
    } else {
      filter.roleId = new mongoose.Types.ObjectId();
    }
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    filter.$or = [
      { id: { $regex: search, $options: "i" } },
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (currentPage - 1) * currentLimit;

  const users = await User.find(filter)
    .populate("roleId", "id rolename permissions pages")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentLimit);

  const total = await User.countDocuments(filter);

  return {
    users,
    total,
    page: currentPage,
    limit: currentLimit,
    totalPages: Math.ceil(total / currentLimit),
    pagination: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
    },
  };
};

/* ================= GET USER BY ID / IDENTIFIER ================= */
export const getUserById = async (identifier) => {
  const user = await User.findOne(buildUserQuery(identifier, true)).populate(
    "roleId",
    "id rolename permissions pages"
  );
  if (!user) {
    const error = new Error(messages.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }
  return user;
};

/* ================= UPDATE USER ================= */
export const updateUser = async (identifier, data) => {
  const user = await User.findOne(buildUserQuery(identifier, true));
  if (!user) {
    const error = new Error(messages.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (data.fullname) user.fullname = data.fullname.trim();
  if (data.email) user.email = data.email.toLowerCase().trim();
  if (data.mobile) user.mobile = data.mobile.trim();
  if (data.image !== undefined) user.image = data.image;
  if (data.password) user.password = data.password;

  if (data.address !== undefined) {
    user.address = parseAddress(data.address);
  }

  if (data.documents !== undefined) {
    user.documents =
      typeof data.documents === "object" && user.documents
        ? mergeObjects(user.documents, data.documents)
        : data.documents;
  }

  if (data.roleId || data.rolename || data.role) {
    const roleDoc = await resolveRole(data);
    if (roleDoc && String(roleDoc._id) !== String(user.roleId)) {
      if (user.roleId) await Role.findByIdAndUpdate(user.roleId, { $inc: { count: -1 } });
      user.roleId = roleDoc._id;
      await Role.findByIdAndUpdate(roleDoc._id, { $inc: { count: 1 } });
    }
  }

  if (data.isActive !== undefined) {
    user.isActive = data.isActive === true || data.isActive === "true";
  }

  if (data.isOtpVerified !== undefined) {
    user.isOtpVerified = data.isOtpVerified === true || data.isOtpVerified === "true";
  }

  if (data.isDeleted !== undefined) {
    const willDelete = data.isDeleted === true || data.isDeleted === "true";
    if (willDelete !== user.isDeleted && user.roleId) {
      await Role.findByIdAndUpdate(user.roleId, { $inc: { count: willDelete ? -1 : 1 } });
    }
    user.isDeleted = willDelete;
  }

  await user.save();
  return user.populate("roleId", "id rolename permissions pages");
};

/* ================= DELETE USER (SOFT DELETE) ================= */
export const deleteUser = async (identifier) => {
  const user = await User.findOne(buildUserQuery(identifier, true));
  if (!user) {
    const error = new Error(messages.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (user.isDeleted) {
    await User.deleteOne({ _id: user._id });
    return { deleted: true, message: "User permanently deleted" };
  }

  user.isDeleted = true;
  await user.save();
  if (user.roleId) {
    await Role.findByIdAndUpdate(user.roleId, { $inc: { count: -1 } });
  }
  return { deleted: true, message: "User deleted successfully" };
};

/* ================= BULK DELETE USERS ================= */
export const bulkDeleteUser = async (data) => {
  const ids = Array.isArray(data)
    ? data
    : Array.isArray(data?.ids)
    ? data.ids
    : Array.isArray(data?.userIds)
    ? data.userIds
    : [];

  if (!ids || ids.length === 0) {
    const error = new Error("No user IDs provided for bulk delete");
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
  const objectIds = ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const users = await User.find({
    $or: [
      { _id: { $in: objectIds } },
      { id: { $in: stringIds } },
      { email: { $in: stringIds.map((s) => s.toLowerCase()) } },
      { mobile: { $in: stringIds } },
    ],
  });

  if (!users || users.length === 0) {
    const error = new Error(messages.USER_NOT_FOUND);
    error.statusCode = 404;
    throw error;
  }

  if (data?.permanent === true || data?.force === true) {
    for (const u of users) {
      if (u.roleId && !u.isDeleted) {
        await Role.findByIdAndUpdate(u.roleId, { $inc: { count: -1 } });
      }
    }
    await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
    return {
      deleted: true,
      totalCount: users.length,
      message: `${users.length} user(s) permanently deleted`,
    };
  }

  const softDeleteIds = [];
  const hardDeleteIds = [];

  for (const user of users) {
    if (user.isDeleted) {
      hardDeleteIds.push(user._id);
    } else {
      softDeleteIds.push(user._id);
      if (user.roleId) {
        await Role.findByIdAndUpdate(user.roleId, { $inc: { count: -1 } });
      }
    }
  }

  if (hardDeleteIds.length > 0) {
    await User.deleteMany({ _id: { $in: hardDeleteIds } });
  }

  if (softDeleteIds.length > 0) {
    await User.updateMany({ _id: { $in: softDeleteIds } }, { $set: { isDeleted: true } });
  }

  return {
    deleted: true,
    totalCount: users.length,
    softDeletedCount: softDeleteIds.length,
    permanentlyDeletedCount: hardDeleteIds.length,
    message: `${users.length} user(s) processed (${softDeleteIds.length} moved to trash, ${hardDeleteIds.length} permanently deleted)`,
  };
};

export const bulkDeleteUsers = bulkDeleteUser;
