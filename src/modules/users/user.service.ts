import type { QueryFilter } from "mongoose";
import { messages } from "../../constants";
import { User, type IUser, type ShopDetails, type UserDocument, type UserDocuments } from "../../models";
import { AppError, mergeObjects, parseAddress, validateRole } from "../../utils";
import type { UpdateUserBody, UserListQuery } from "./user.types";

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const toPositiveInt = (value: string | undefined, fallback: number): number => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const getUsers = async (
  query: UserListQuery = {}
): Promise<{ users: UserDocument[]; pagination: Pagination }> => {
  const { role, status, search } = query;
  const page = toPositiveInt(query.page, 1);
  const limit = Math.min(toPositiveInt(query.limit, 20), 100);

  const filter: QueryFilter<IUser> = { isDeleted: false };
  if (role) filter.role = role;
  if (status !== undefined) filter.status = status === "true";
  if (search) {
    filter.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(filter),
  ]);

  return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const getUserById = async (id: string): Promise<UserDocument> => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw AppError.notFound(messages.USER_NOT_FOUND);
  return user;
};

export const updateUser = async (id: string, data: UpdateUserBody): Promise<UserDocument> => {
  const user = await getUserById(id);

  if (data.fullname) user.fullname = data.fullname;
  if (data.email) user.email = data.email;
  if (data.mobile) user.mobile = data.mobile;
  if (data.image !== undefined) user.image = data.image;
  if (data.role) user.role = await validateRole(data.role);
  if (data.password) user.password = data.password; // hashed by pre-save hook
  if (data.address) user.set("address", parseAddress(data.address));

  const current = user.toObject();
  if (data.shopDetails) {
    user.set("shopDetails", mergeObjects<ShopDetails>(current.shopDetails, data.shopDetails));
  }
  if (data.documents) {
    user.set("documents", mergeObjects<UserDocuments>(current.documents, data.documents));
  }

  await user.save();
  return user;
};
