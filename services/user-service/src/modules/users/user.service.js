import { utils, constants, models } from "../../../../../shared/index.js";

const { messages } = constants;
const { User, Role } = models;
const { parseAddress, validateRole, mergeObjects } = utils;

export const getUsers = async (query = {}) => {
  const { role, status, search, page = 1, limit = 20 } = query;
  
  const filter = { isDeleted: false };
  
  if (role) filter.role = role;
  if (status !== undefined) filter.status = status;
  if (search) {
    filter.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const users = await User.find(filter)
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
      totalPages: Math.ceil(total / parseInt(limit))
    }
  };
};

export const getUserById = async (id) => {
  const user = await User.findOne({ _id: id, isDeleted: false });
  if (!user) throw new Error(messages.USER_NOT_FOUND);
  return user;
};

export const updateUser = async (id, data) => {
  const user = await User.findOne({ _id: id, isDeleted: false });

  if (!user) throw new Error(messages.USER_NOT_FOUND);

  if (data.fullname) user.fullname = data.fullname;
  if (data.email) user.email = data.email;
  if (data.mobile) user.mobile = data.mobile;
  if (data.image !== undefined) user.image = data.image;

  if (data.role) user.role = await validateRole(data.role);

  if (data.password) user.password = data.password;

  if (data.address) user.address = parseAddress(data.address);

  if (data.shopDetails) {
    user.shopDetails = mergeObjects(user.shopDetails, data.shopDetails);
  }

  if (data.documents) {
    user.documents = mergeObjects(user.documents, data.documents);
  }

  await user.save();

  return user;
};
