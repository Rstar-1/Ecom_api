import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";

const { info, buildBlogCategoryQuery } = utils;
const { BlogCategory, Blog, User } = models;

/* ================= RESOLVE CREATOR USER ================= */
const resolveCreatorId = async (providedId) => {
  let val = providedId;
  if (val && typeof val === "object") {
    val = val._id || val.id || val.userId || val.email;
  }
  if (val) {
    const strVal = String(val).trim();
    if (mongoose.Types.ObjectId.isValid(strVal)) {
      const userDoc = await User.findById(strVal).select("_id");
      if (userDoc) return userDoc._id;
    }
    const userDoc = await User.findOne({
      $or: [{ id: strVal }, { email: strVal.toLowerCase() }],
    }).select("_id");
    if (userDoc) return userDoc._id;
  }
  const defaultUser = await User.findOne({ isDeleted: false }).select("_id");
  if (defaultUser) return defaultUser._id;
  return new mongoose.Types.ObjectId("6a8691ede8fdc4bafebc857b");
};

/* ================= CREATE BLOG CATEGORY ================= */
export const createBlogCategory = async (data = {}) => {
  const rawName = data.categoryName || data.name || "";
  if (!rawName.trim()) {
    const error = new Error("Category name is required");
    error.statusCode = 400;
    throw error;
  }

  const categoryName = rawName.trim();

  // Check if category with this name already exists
  const existingCategory = await BlogCategory.findOne({ categoryName });
  if (existingCategory) {
    if (existingCategory.isDeleted) {
      existingCategory.isDeleted = false;
      existingCategory.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
      if (data.count !== undefined) existingCategory.count = Number(data.count);
      await existingCategory.save();
      info(`BLOG_CATEGORY_RESTORED_AND_UPDATED: ${existingCategory.categoryName} (${existingCategory.id})`);
      return existingCategory;
    }
    const error = new Error(`Category "${categoryName}" already exists`);
    error.statusCode = 409;
    throw error;
  }

  if (data.id && data.id.trim()) {
    const existingId = await BlogCategory.findOne({ id: data.id.trim() });
    if (existingId) {
      const error = new Error(`Category with ID ${data.id.trim()} already exists`);
      error.statusCode = 409;
      throw error;
    }
  }

  const createdBy = await resolveCreatorId(data.createdBy);

  const category = await BlogCategory.create({
    ...(data.id && data.id.trim() ? { id: data.id.trim() } : {}),
    categoryName,
    count: data.count !== undefined ? Number(data.count) : 0,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
    createdBy,
  });

  info(`BLOG_CATEGORY_CREATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", "id fullname email mobile image");
};

/* ================= GET ALL BLOG CATEGORIES ================= */
export const getBlogCategories = async (query = {}) => {
  const { isDeleted, isActive, search, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") {
      filter.isDeleted = isDeleted === "true" || isDeleted === true;
    }
  } else {
    filter.isDeleted = false;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    filter.$or = [
      { id: { $regex: search, $options: "i" } },
      { categoryName: { $regex: search, $options: "i" } },
    ];
  }

  // Live count aggregation from Blog collection
  const blogCounts = await Blog.aggregate([
    { $match: { isDeleted: false } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(blogCounts.map((b) => [String(b._id), b.count]));

  const isPaginated = page !== undefined || limit !== undefined;

  let queryBuilder = BlogCategory.find(filter)
    .populate("createdBy", "id fullname email mobile image")
    .sort({ createdAt: -1 });

  let currentPage = 1;
  let currentLimit = 10;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;

    total = await BlogCategory.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const categories = await queryBuilder.lean();
  const formattedCategories = categories.map((c) => ({
    ...c,
    count: countMap.get(String(c._id)) ?? c.count ?? 0,
  }));

  if (isPaginated) {
    return {
      categories: formattedCategories,
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
  }

  return formattedCategories;
};

/* ================= GET BLOG CATEGORY BY ID ================= */
export const getBlogCategoryById = async (identifier) => {
  const category = await BlogCategory.findOne(buildBlogCategoryQuery(identifier, true)).populate(
    "createdBy",
    "id fullname email mobile image"
  );
  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  const count = await Blog.countDocuments({ categoryId: category._id, isDeleted: false });
  const categoryObj = category.toObject();
  categoryObj.count = count;
  return categoryObj;
};

/* ================= UPDATE BLOG CATEGORY ================= */
export const updateBlogCategory = async (identifier, data) => {
  const category = await BlogCategory.findOne(buildBlogCategoryQuery(identifier, true));
  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  const rawName = data.categoryName || data.name;
  if (rawName && rawName.trim()) {
    const categoryName = rawName.trim();
    const exists = await BlogCategory.findOne({
      categoryName,
      _id: { $ne: category._id },
      isDeleted: false,
    });

    if (exists) {
      const error = new Error(`Category "${categoryName}" already exists`);
      error.statusCode = 409;
      throw error;
    }
    category.categoryName = categoryName;
  }

  if (data.id && data.id.trim() !== category.id) {
    const newId = data.id.trim();
    const exists = await BlogCategory.findOne({ id: newId, _id: { $ne: category._id } });
    if (exists) {
      const error = new Error(`Category with ID ${newId} already exists`);
      error.statusCode = 409;
      throw error;
    }
    category.id = newId;
  }

  if (data.count !== undefined) {
    category.count = Math.max(0, Number(data.count) || 0);
  }

  if (data.isActive !== undefined) {
    category.isActive = data.isActive === true || data.isActive === "true";
  }

  if (data.isDeleted !== undefined) {
    category.isDeleted = data.isDeleted === true || data.isDeleted === "true";
  }

  if (data.createdBy !== undefined) {
    category.createdBy = await resolveCreatorId(data.createdBy);
  }

  await category.save();
  info(`BLOG_CATEGORY_UPDATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", "id fullname email mobile image");
};

/* ================= DELETE BLOG CATEGORY (SOFT / HARD) ================= */
export const deleteBlogCategory = async (identifier) => {
  const category = await BlogCategory.findOne(buildBlogCategoryQuery(identifier, true));
  if (!category) {
    const error = new Error("Category not found");
    error.statusCode = 404;
    throw error;
  }

  if (category.isDeleted) {
    await BlogCategory.deleteOne({ _id: category._id });
    info(`BLOG_CATEGORY_PERMANENTLY_DELETED: ${category.categoryName} (${category.id})`);
    return { deleted: true, message: `Category ${category.categoryName} permanently removed` };
  }

  category.isDeleted = true;
  await category.save();

  info(`BLOG_CATEGORY_DELETED: ${category.categoryName} (${category.id})`);
  return { deleted: true, message: `Category ${category.categoryName} deleted successfully` };
};

/* ================= BULK DELETE BLOG CATEGORIES ================= */
export const bulkDeleteBlogCategory = async (data) => {
  const ids = Array.isArray(data)
    ? data
    : Array.isArray(data?.ids)
    ? data.ids
    : Array.isArray(data?.categoryIds)
    ? data.categoryIds
    : [];

  if (!ids || ids.length === 0) {
    const error = new Error("No category IDs provided for bulk delete");
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
  const objectIds = ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const categories = await BlogCategory.find({
    $or: [
      { _id: { $in: objectIds } },
      { id: { $in: stringIds } },
      { categoryName: { $in: stringIds } },
    ],
  });

  if (!categories || categories.length === 0) {
    const error = new Error("No matching categories found");
    error.statusCode = 404;
    throw error;
  }

  if (data?.permanent === true || data?.force === true) {
    await BlogCategory.deleteMany({ _id: { $in: categories.map((c) => c._id) } });
    info(`BLOG_CATEGORIES_PERMANENTLY_BULK_DELETED: ${categories.length} categories removed`);
    return {
      deleted: true,
      totalCount: categories.length,
      message: `${categories.length} category(s) permanently deleted`,
    };
  }

  const softDeleteIds = [];
  const hardDeleteIds = [];

  for (const cat of categories) {
    if (cat.isDeleted) {
      hardDeleteIds.push(cat._id);
    } else {
      softDeleteIds.push(cat._id);
    }
  }

  if (hardDeleteIds.length > 0) {
    await BlogCategory.deleteMany({ _id: { $in: hardDeleteIds } });
  }

  if (softDeleteIds.length > 0) {
    await BlogCategory.updateMany({ _id: { $in: softDeleteIds } }, { $set: { isDeleted: true } });
  }

  return {
    deleted: true,
    totalCount: categories.length,
    softDeletedCount: softDeleteIds.length,
    permanentlyDeletedCount: hardDeleteIds.length,
    message: `${categories.length} category(s) processed (${softDeleteIds.length} moved to trash, ${hardDeleteIds.length} permanently deleted)`,
  };
};

export const bulkDeleteBlogCategories = bulkDeleteBlogCategory;

