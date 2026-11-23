import mongoose from "mongoose";
import { messages } from "../../constants";
import { Role } from "../roles/role.model";
import { User, type UserDocument } from "./user.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  exactCi,
  identifierFilter,
  isObjectId,
  isPermanent,
  mergeObjects,
  pagedResult,
  parseAddress,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  type Filter,
} from "../../utils";
import { resolveRole, ROLE_POPULATE } from "../roles/role.helpers";
import type { UpdateUserBody, UserListQuery } from "./user.types";

const userLookup = (identifier: string): Filter =>
  identifierFilter(identifier, (v) => [{ email: v.toLowerCase() }, { mobile: v }]);

const findUser = async (identifier: string): Promise<UserDocument> => {
  const user = await User.findOne(userLookup(identifier));
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);
  return user;
};

const changeRoleCount = (roleId: unknown, by: 1 | -1) =>
  roleId ? Role.updateOne({ _id: roleId }, { $inc: { count: by } }) : Promise.resolve();

/* ================= LIST ================= */
export const getUsers = async (query: UserListQuery = {}) => {
  const filter: Filter = { ...baseListFilter(query), ...searchFilter(query.search, ["id", "fullname", "email", "mobile"]) };

  const roleTerm = str(query.roleId || query.role || query.rolename);
  if (roleTerm && roleTerm !== "all") {
    const roleDoc = isObjectId(roleTerm)
      ? { _id: new mongoose.Types.ObjectId(roleTerm) }
      : await Role.findOne({ $or: [{ rolename: exactCi(roleTerm) }, { id: roleTerm }] }).select("_id").lean();
    // unknown role -> match nothing
    filter.roleId = roleDoc?._id ?? new mongoose.Types.ObjectId();
  }

  const paging = readPagination(query, 20, true);
  const [users, total] = await Promise.all([
    User.find(filter).populate("roleId", ROLE_POPULATE).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit),
    User.countDocuments(filter),
  ]);

  return pagedResult("users", users, total, paging);
};

/* ================= GET ONE (Mongo _id, USER-001, email or mobile) ================= */
export const getUserById = async (identifier: string) => {
  const user = await User.findOne(userLookup(identifier)).populate("roleId", ROLE_POPULATE);
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);
  return user;
};

/* ================= UPDATE ================= */
export const updateUser = async (identifier: string, data: UpdateUserBody) => {
  const user = await findUser(identifier);

  if (str(data.fullname)) user.fullname = str(data.fullname);
  if (str(data.email)) user.email = str(data.email).toLowerCase();
  if (str(data.mobile)) user.mobile = str(data.mobile);
  if (data.image !== undefined) user.image = data.image;
  if (data.password) user.password = data.password; // hashed by pre-save hook
  if (data.address !== undefined) user.set("address", parseAddress(data.address));

  if (data.documents !== undefined) {
    const current: unknown = user.get("documents");
    const merged =
      data.documents && current && typeof current === "object"
        ? mergeObjects(current as Record<string, unknown>, data.documents)
        : data.documents;
    user.set("documents", merged);
  }

  if (data.roleId || data.rolename || data.role) {
    const roleDoc = await resolveRole(data);
    if (!roleDoc._id.equals(user.roleId)) {
      await changeRoleCount(user.roleId, -1);
      user.roleId = roleDoc._id;
      await changeRoleCount(roleDoc._id, 1);
    }
  }

  if (data.isActive !== undefined) user.isActive = toBool(data.isActive);
  if (data.isOtpVerified !== undefined) user.isOtpVerified = toBool(data.isOtpVerified);
  if (data.isDeleted !== undefined) {
    const willDelete = toBool(data.isDeleted);
    if (willDelete !== user.isDeleted) await changeRoleCount(user.roleId, willDelete ? -1 : 1);
    user.isDeleted = willDelete;
  }

  await user.save();
  return user.populate("roleId", ROLE_POPULATE);
};

/* ================= DELETE (soft first, permanent if already in trash) ================= */
export const deleteUser = async (identifier: string) => {
  const user = await findUser(identifier);

  if (user.isDeleted) {
    await User.deleteOne({ _id: user._id });
    return { deleted: true, message: "User permanently deleted" };
  }

  user.isDeleted = true;
  await user.save();
  await changeRoleCount(user.roleId, -1);
  return { deleted: true, message: "User deleted successfully" };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteUsers = async (body: unknown) => {
  const ids = readBulkIds(body, "userIds");
  const users = await User.find(bulkFilter(ids.concat(ids.map((i) => i.toLowerCase())), ["email", "mobile"]));
  if (users.length === 0) throw AppError.notFound(messages.USER_NOT_FOUND);

  const active = users.filter((u) => !u.isDeleted);
  await Promise.all(active.map((u) => changeRoleCount(u.roleId, -1)));

  if (isPermanent(body)) {
    await User.deleteMany({ _id: { $in: users.map((u) => u._id) } });
    return { deleted: true, totalCount: users.length, message: `${users.length} user(s) permanently deleted` };
  }

  const hardIds = users.filter((u) => u.isDeleted).map((u) => u._id);
  const softIds = active.map((u) => u._id);
  if (hardIds.length) await User.deleteMany({ _id: { $in: hardIds } });
  if (softIds.length) await User.updateMany({ _id: { $in: softIds } }, { $set: { isDeleted: true } });

  return {
    deleted: true,
    totalCount: users.length,
    softDeletedCount: softIds.length,
    permanentlyDeletedCount: hardIds.length,
    message: `${users.length} user(s) processed (${softIds.length} moved to trash, ${hardIds.length} permanently deleted)`,
  };
};
