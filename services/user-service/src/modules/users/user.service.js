import { utils, constants, models } from "../../../../../shared/index.js";

const { messages } = constants;
const { User } = models;
const { parseAddress, mergeObjects, resolveRole, buildUserQuery } = utils;

/* ================= GET ALL USERS ================= */
export const getUsers = async (query = {}) => {
  const { roleId, isActive, search, page = 1, limit = 20 } = query;

  const filter = { isDeleted: false };

  if (roleId) filter.roleId = roleId;
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

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(filter)
    .populate("roleId", "id rolename permissions pages")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  return {
    users,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    },
  };
};

/* ================= GET USER BY ID / IDENTIFIER ================= */
export const getUserById = async (identifier) => {
  const user = await User.findOne(buildUserQuery(identifier)).populate(
    "roleId",
    "id rolename permissions pages"
  );
  if (!user) throw new Error(messages.USER_NOT_FOUND);
  return user;
};

/* ================= UPDATE USER ================= */
export const updateUser = async (identifier, data) => {
  const user = await User.findOne(buildUserQuery(identifier));
  if (!user) throw new Error(messages.USER_NOT_FOUND);

  if (data.fullname) user.fullname = data.fullname.trim();
  if (data.email) user.email = data.email.toLowerCase().trim();
  if (data.mobile) user.mobile = data.mobile.trim();
  if (data.image !== undefined) user.image = data.image;
  if (data.password) user.password = data.password;

  if (data.address !== undefined) {
    user.address = parseAddress(data.address);
  }

  if (data.documents !== undefined) {
    user.documents = typeof data.documents === "object" && user.documents
      ? mergeObjects(user.documents, data.documents)
      : data.documents;
  }

  if (data.roleId || data.rolename || data.role) {
    const roleDoc = await resolveRole(data);
    if (roleDoc) user.roleId = roleDoc._id;
  }

  if (data.isActive !== undefined) {
    user.isActive = Boolean(data.isActive);
  }

  await user.save();
  return user.populate("roleId", "id rolename permissions pages");
};

/* ================= DELETE USER (SOFT DELETE) ================= */
export const deleteUser = async (identifier) => {
  const user = await User.findOne(buildUserQuery(identifier));
  if (!user) throw new Error(messages.USER_NOT_FOUND);

  user.isDeleted = true;
  await user.save();
  return { deleted: true, message: "User deleted successfully" };
};
