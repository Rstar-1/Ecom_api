import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";

const { info, buildBlogQuery } = utils;
const { Blog, BlogCategory, User } = models;

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
  return new mongoose.Types.ObjectId("6a86ec15b1a3f595b6ec1bf2");
};

/* ================= RESOLVE CATEGORY ID ================= */
const resolveCategoryId = async (providedId) => {
  if (!providedId) {
    const error = new Error("Category ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (mongoose.Types.ObjectId.isValid(providedId)) {
    return new mongoose.Types.ObjectId(providedId);
  }

  const category = await BlogCategory.findOne({
    $or: [{ id: providedId }, { categoryName: providedId.trim() }],
    isDeleted: false,
  });

  if (!category) {
    const error = new Error("Category not found or inactive");
    error.statusCode = 400;
    throw error;
  }

  return category._id;
};

/* ================= PARSE ARRAY FIELDS ================= */
const parseArray = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return field.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
};

/* ================= CREATE BLOG ================= */
export const createBlog = async (data = {}) => {
  if (!data.blogName || !data.blogName.trim()) {
    const error = new Error("Blog name is required");
    error.statusCode = 400;
    throw error;
  }

  if (!data.description || !data.description.trim()) {
    const error = new Error("Blog description is required");
    error.statusCode = 400;
    throw error;
  }

  if (!data.categoryId) {
    const error = new Error("Category ID is required");
    error.statusCode = 400;
    throw error;
  }

  const categoryId = await resolveCategoryId(data.categoryId);
  const createdBy = await resolveCreatorId(data.createdBy);

  if (data.id && data.id.trim()) {
    const existingId = await Blog.findOne({ id: data.id.trim() });
    if (existingId) {
      const error = new Error(`Blog with ID ${data.id.trim()} already exists`);
      error.statusCode = 409;
      throw error;
    }
  }

  const blog = await Blog.create({
    ...(data.id && data.id.trim() ? { id: data.id.trim() } : {}),
    categoryId,
    blogName: data.blogName.trim(),
    description: data.description.trim(),
    shortDesc: data.shortDesc?.trim() || "",
    quote: data.quote?.trim() || "",
    image: data.image || "",
    readTime: data.readTime || "1 min read",
    badges: parseArray(data.badges),
    specifications: parseArray(data.specifications),
    reviews: parseArray(data.reviews),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
    createdBy,
  });

  // Increment BlogCategory count
  await BlogCategory.findByIdAndUpdate(categoryId, { $inc: { count: 1 } });

  info(`BLOG_CREATED: ${blog.blogName} (${blog.id})`);
  return blog.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

/* ================= GET ALL BLOGS ================= */
export const getBlogs = async (query = {}) => {
  const {
    categoryId,
    isActive,
    search,
    page = 1,
    limit = 20,
    isDeleted,
  } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") {
      filter.isDeleted = isDeleted === "true" || isDeleted === true;
    }
  } else {
    filter.isDeleted = false;
  }

  if (categoryId) {
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    } else {
      const cat = await BlogCategory.findOne({ id: categoryId }).select("_id").lean();
      if (cat) filter.categoryId = cat._id;
    }
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (search) {
    filter.$or = [
      { id: { $regex: search, $options: "i" } },
      { blogName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { shortDesc: { $regex: search, $options: "i" } },
    ];
  }

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.max(1, parseInt(limit, 10) || 20);
  const skip = (currentPage - 1) * currentLimit;

  const blogs = await Blog.find(filter)
    .populate("categoryId", "id categoryName count")
    .populate("createdBy", "id fullname email mobile image")
    .populate("reviews.createdBy", "id fullname email mobile image")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(currentLimit);

  const total = await Blog.countDocuments(filter);

  return {
    blogs,
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

/* ================= GET BLOG BY ID ================= */
export const getBlogById = async (identifier) => {
  const blog = await Blog.findOne(buildBlogQuery(identifier, true))
    .populate("categoryId", "id categoryName count")
    .populate("createdBy", "id fullname email mobile image")
    .populate("reviews.createdBy", "id fullname email mobile image");

  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  return blog;
};

/* ================= UPDATE BLOG ================= */
export const updateBlog = async (identifier, data = {}) => {
  const blog = await Blog.findOne(buildBlogQuery(identifier, true));
  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.blogName) blog.blogName = data.blogName.trim();
  if (data.description) blog.description = data.description.trim();
  if (data.shortDesc !== undefined) blog.shortDesc = data.shortDesc.trim();
  if (data.quote !== undefined) blog.quote = data.quote.trim();
  if (data.readTime !== undefined) blog.readTime = data.readTime.trim();
  if (data.image !== undefined) blog.image = data.image;

  if (data.badges !== undefined) blog.badges = parseArray(data.badges);
  if (data.specifications !== undefined) blog.specifications = parseArray(data.specifications);
  if (data.createdBy !== undefined) {
    blog.createdBy = await resolveCreatorId(data.createdBy);
  }

  // Handle category change
  if (data.categoryId) {
    const newCatId = await resolveCategoryId(data.categoryId);
    if (String(newCatId) !== String(blog.categoryId)) {
      if (blog.categoryId && !blog.isDeleted) {
        await BlogCategory.findByIdAndUpdate(blog.categoryId, { $inc: { count: -1 } });
      }
      blog.categoryId = newCatId;
      if (!blog.isDeleted) {
        await BlogCategory.findByIdAndUpdate(newCatId, { $inc: { count: 1 } });
      }
    }
  }

  if (data.isActive !== undefined) {
    blog.isActive = data.isActive === true || data.isActive === "true";
  }

  if (data.isDeleted !== undefined) {
    const willDelete = data.isDeleted === true || data.isDeleted === "true";
    if (willDelete !== blog.isDeleted && blog.categoryId) {
      await BlogCategory.findByIdAndUpdate(blog.categoryId, { $inc: { count: willDelete ? -1 : 1 } });
    }
    blog.isDeleted = willDelete;
  }

  await blog.save();
  info(`BLOG_UPDATED: ${blog.blogName} (${blog.id})`);
  return blog.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

/* ================= DELETE BLOG (SOFT / HARD) ================= */
export const deleteBlog = async (identifier) => {
  const blog = await Blog.findOne(buildBlogQuery(identifier, true));
  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  if (blog.isDeleted) {
    await Blog.deleteOne({ _id: blog._id });
    info(`BLOG_PERMANENTLY_DELETED: ${blog.blogName} (${blog.id})`);
    return { deleted: true, message: `Blog ${blog.blogName} permanently removed` };
  }

  blog.isDeleted = true;
  await blog.save();

  if (blog.categoryId) {
    await BlogCategory.findByIdAndUpdate(blog.categoryId, { $inc: { count: -1 } });
  }

  info(`BLOG_DELETED: ${blog.blogName} (${blog.id})`);
  return { deleted: true, message: `Blog ${blog.blogName} moved to trash` };
};

/* ================= BULK DELETE BLOGS ================= */
export const bulkDeleteBlog = async (data) => {
  const ids = Array.isArray(data)
    ? data
    : Array.isArray(data?.ids)
    ? data.ids
    : Array.isArray(data?.blogIds)
    ? data.blogIds
    : [];

  if (!ids || ids.length === 0) {
    const error = new Error("No blog IDs provided for bulk delete");
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
  const objectIds = ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const blogs = await Blog.find({
    $or: [{ _id: { $in: objectIds } }, { id: { $in: stringIds } }],
  });

  if (!blogs || blogs.length === 0) {
    const error = new Error("No matching blogs found");
    error.statusCode = 404;
    throw error;
  }

  if (data?.permanent === true || data?.force === true) {
    for (const b of blogs) {
      if (b.categoryId && !b.isDeleted) {
        await BlogCategory.findByIdAndUpdate(b.categoryId, { $inc: { count: -1 } });
      }
    }
    await Blog.deleteMany({ _id: { $in: blogs.map((b) => b._id) } });
    info(`BLOGS_PERMANENTLY_BULK_DELETED: ${blogs.length} blogs removed`);
    return {
      deleted: true,
      totalCount: blogs.length,
      message: `${blogs.length} blog(s) permanently deleted`,
    };
  }

  const softDeleteIds = [];
  const hardDeleteIds = [];

  for (const b of blogs) {
    if (b.isDeleted) {
      hardDeleteIds.push(b._id);
    } else {
      softDeleteIds.push(b._id);
      if (b.categoryId) {
        await BlogCategory.findByIdAndUpdate(b.categoryId, { $inc: { count: -1 } });
      }
    }
  }

  if (hardDeleteIds.length > 0) {
    await Blog.deleteMany({ _id: { $in: hardDeleteIds } });
  }

  if (softDeleteIds.length > 0) {
    await Blog.updateMany({ _id: { $in: softDeleteIds } }, { $set: { isDeleted: true } });
  }

  return {
    deleted: true,
    totalCount: blogs.length,
    softDeletedCount: softDeleteIds.length,
    permanentlyDeletedCount: hardDeleteIds.length,
    message: `${blogs.length} blog(s) processed (${softDeleteIds.length} moved to trash, ${hardDeleteIds.length} permanently deleted)`,
  };
};

export const bulkDeleteBlogs = bulkDeleteBlog;

/* ================= ADD REVIEW ================= */
export const addReview = async (identifier, reviewData = {}) => {
  const blog = await Blog.findOne(buildBlogQuery(identifier, true));
  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  const rating = Number(reviewData.rating);
  if (!rating || rating < 1 || rating > 5) {
    const error = new Error("Rating must be between 1 and 5");
    error.statusCode = 400;
    throw error;
  }

  const createdBy = await resolveCreatorId(reviewData.createdBy);

  let nextReviewId = reviewData.id;
  if (!nextReviewId) {
    const reviewCount = (blog.reviews || []).length + 1;
    nextReviewId = `BREW-${String(reviewCount).padStart(3, "0")}`;
  }

  const review = {
    id: nextReviewId,
    comment: reviewData.comment?.trim() || "",
    rating,
    isActive: reviewData.isActive !== undefined ? Boolean(reviewData.isActive) : true,
    isDeleted: false,
    createdBy,
  };

  blog.reviews.push(review);
  await blog.save();

  info(`BLOG_REVIEW_ADDED: ${blog.id} -> ${review.id}`);
  return blog.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

/* ================= DELETE REVIEW ================= */
export const deleteReview = async (identifier, reviewId) => {
  const blog = await Blog.findOne(buildBlogQuery(identifier, true));
  if (!blog) {
    const error = new Error("Blog not found");
    error.statusCode = 404;
    throw error;
  }

  const reviewIndex = blog.reviews.findIndex(
    (r) => String(r._id) === String(reviewId) || r.id === String(reviewId)
  );

  if (reviewIndex === -1) {
    const error = new Error("Review not found");
    error.statusCode = 404;
    throw error;
  }

  blog.reviews.splice(reviewIndex, 1);
  await blog.save();

  return { deleted: true, message: "Review deleted successfully" };
};

