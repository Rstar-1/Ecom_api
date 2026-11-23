import mongoose from "mongoose";
import { Blog } from "./blog.model";
import { BlogCategory } from "../blog-categories/blog-category.model";
import type { ReviewInput, SpecificationInput } from "../products/product.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  cache,
  exactCi,
  identifierFilter,
  isObjectId,
  isPermanent,
  logger,
  pagedResult,
  parseList,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  type Filter,
} from "../../utils";

const invalidateBlogCaches = () => {
  cache.invalidate("blogs");
  cache.invalidate("blogs_status_counts");
  cache.invalidate("blog_categories");
  cache.invalidate("blog_categories_counts");
  cache.invalidate("blog_categories_status_counts");
};
import { CREATOR_POPULATE } from "../roles/role.helpers";
import type { BlogBody, BlogListQuery } from "./blog.types";

const POPULATE = [
  { path: "categoryId", select: "id categoryName count" },
  { path: "createdBy", select: CREATOR_POPULATE },
  { path: "reviews.createdBy", select: CREATOR_POPULATE },
];

export const computeReadTime = (...texts: unknown[]): string => {
  const combined = texts.map((t) => str(t)).filter(Boolean).join(' ');
  const words = combined.trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
};

const findBlog = async (identifier: string) => {
  const blog = await Blog.findOne(identifierFilter(identifier, (v) => [{ blogName: exactCi(v) }]));
  if (!blog) throw AppError.notFound("Blog not found");
  return blog;
};

/** Blog category by Mongo _id, BCAT-001 or name (must exist and not be deleted). */
const resolveCategoryId = async (identifier: unknown) => {
  const value = str(identifier);
  if (!value) throw AppError.badRequest("Category ID is required");
  const category = await BlogCategory.findOne({
    ...identifierFilter(value, (v) => [{ categoryName: v }]),
    isDeleted: false,
  });
  if (!category) throw AppError.badRequest("Category not found or inactive");
  return category._id;
};

const changeCategoryCount = (categoryId: unknown, by: 1 | -1) =>
  categoryId ? BlogCategory.updateOne({ _id: categoryId }, { $inc: { count: by } }) : Promise.resolve();

/* ================= CREATE ================= */
export const createBlog = async (data: BlogBody, createdBy: string) => {
  const blogName = str(data.blogName);
  const description = str(data.description);
  if (!blogName) throw AppError.badRequest("Blog name is required");
  if (!description) throw AppError.badRequest("Blog description is required");

  const categoryId = await resolveCategoryId(data.categoryId);
  const id = str(data.id);
  if (id && (await Blog.exists({ id }))) throw AppError.conflict(`Blog with ID ${id} already exists`);

  const blog = await Blog.create({
    ...(id ? { id } : {}),
    categoryId,
    blogName,
    description,
    shortDesc: str(data.shortDesc),
    quote: str(data.quote),
    image: data.image ?? "",
    readTime: str(data.readTime) || computeReadTime(description, data.shortDesc),
    badges: parseList(data.badges),
    specifications: parseList<SpecificationInput>(data.specifications),
    isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
    createdBy,
  });

  await changeCategoryCount(categoryId, 1);
  invalidateBlogCaches();
  logger.info(`BLOG_CREATED: ${blog.blogName} (${blog.id})`);
  return blog.populate(POPULATE);
};

/* ================= LIST (always paginated, default 20) ================= */
export const getBlogs = async (query: BlogListQuery = {}) => {
  return cache.wrap(
    "blogs",
    query as Record<string, unknown>,
    async () => {
      const filter: Filter = {
        ...baseListFilter(query),
        ...searchFilter(query.search, ["id", "blogName", "description", "shortDesc"]),
      };

      if (query.categoryId) {
        if (isObjectId(query.categoryId)) filter.categoryId = new mongoose.Types.ObjectId(query.categoryId);
        else {
          const cat = await BlogCategory.findOne({ id: query.categoryId }).select("_id").lean();
          filter.categoryId = cat?._id ?? new mongoose.Types.ObjectId(); // unknown category -> no results
        }
      }

      const paging = readPagination(query, 20, true);

      const [blogs, total, active, inactive, trash] = await Promise.all([
        Blog.find(filter)
          .select("id blogName shortDesc description quote readTime image categoryId isActive isDeleted createdBy createdAt updatedAt")
          .populate("categoryId", "id categoryName")
          .sort({ createdAt: -1 })
          .skip(paging.skip)
          .limit(paging.limit)
          .lean(),
        Blog.countDocuments(filter),
        Blog.countDocuments({ isDeleted: false, isActive: true }),
        Blog.countDocuments({ isDeleted: false, isActive: false }),
        Blog.countDocuments({ isDeleted: true }),
      ]);

      const result: any = pagedResult("blogs", blogs, total, paging);
      result.counts = { all: active + inactive, active, inactive, trash };
      return result;
    },
    60
  );
};

/* ================= GET ONE (Mongo _id, BLOG-001 or name) ================= */
export const getBlogById = async (identifier: string) => (await findBlog(identifier)).populate(POPULATE);

/* ================= UPDATE ================= */
export const updateBlog = async (identifier: string, data: BlogBody) => {
  const blog = await findBlog(identifier);

  if (str(data.blogName)) blog.blogName = str(data.blogName);
  if (str(data.description)) blog.description = str(data.description);
  if (data.shortDesc !== undefined) blog.shortDesc = str(data.shortDesc);
  if (data.quote !== undefined) blog.quote = str(data.quote);
  if (data.readTime !== undefined) {
    blog.readTime = str(data.readTime) || computeReadTime(blog.description, blog.shortDesc);
  } else if (str(data.description) || data.shortDesc !== undefined) {
    blog.readTime = computeReadTime(blog.description, blog.shortDesc);
  }
  if (data.image !== undefined) blog.image = data.image;
  if (data.badges !== undefined) blog.set("badges", parseList(data.badges));
  if (data.specifications !== undefined) {
    blog.set("specifications", parseList<SpecificationInput>(data.specifications));
  }

  if (data.categoryId) {
    const newCategoryId = await resolveCategoryId(data.categoryId);
    if (!newCategoryId.equals(blog.categoryId)) {
      if (!blog.isDeleted) {
        await changeCategoryCount(blog.categoryId, -1);
        await changeCategoryCount(newCategoryId, 1);
      }
      blog.categoryId = newCategoryId;
    }
  }

  if (data.isActive !== undefined) blog.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) {
    const willDelete = toBool(data.isDeleted);
    if (willDelete !== blog.isDeleted) await changeCategoryCount(blog.categoryId, willDelete ? -1 : 1);
    blog.isDeleted = willDelete;
  }

  await blog.save();
  invalidateBlogCaches();
  logger.info(`BLOG_UPDATED: ${blog.blogName} (${blog.id})`);
  return blog.populate(POPULATE);
};

/* ================= DELETE (soft first, permanent if already in trash) ================= */
export const deleteBlog = async (identifier: string) => {
  const blog = await findBlog(identifier);

  invalidateBlogCaches();
  if (blog.isDeleted) {
    await Blog.deleteOne({ _id: blog._id });
    logger.info(`BLOG_PERMANENTLY_DELETED: ${blog.blogName} (${blog.id})`);
    return { deleted: true, message: `Blog ${blog.blogName} permanently removed` };
  }

  blog.isDeleted = true;
  await blog.save();
  await changeCategoryCount(blog.categoryId, -1);
  logger.info(`BLOG_DELETED: ${blog.blogName} (${blog.id})`);
  return { deleted: true, message: `Blog ${blog.blogName} moved to trash` };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteBlogs = async (body: unknown) => {
  const ids = readBulkIds(body, "blogIds");
  const matched = await Blog.find(bulkFilter(ids));
  if (matched.length === 0) throw AppError.notFound("No matching blogs found");

  invalidateBlogCaches();
  const active = matched.filter((b) => !b.isDeleted);
  await Promise.all(active.map((b) => changeCategoryCount(b.categoryId, -1)));

  if (isPermanent(body)) {
    await Blog.deleteMany({ _id: { $in: matched.map((b) => b._id) } });
    return { deleted: true, totalCount: matched.length, message: `${matched.length} blog(s) permanently deleted` };
  }

  const hardIds = matched.filter((b) => b.isDeleted).map((b) => b._id);
  const softIds = active.map((b) => b._id);
  if (hardIds.length) await Blog.deleteMany({ _id: { $in: hardIds } });
  if (softIds.length) await Blog.updateMany({ _id: { $in: softIds } }, { $set: { isDeleted: true } });

  return {
    deleted: true,
    totalCount: matched.length,
    softDeletedCount: softIds.length,
    permanentlyDeletedCount: hardIds.length,
    message: `${matched.length} blog(s) processed (${softIds.length} moved to trash, ${hardIds.length} permanently deleted)`,
  };
};

/* ================= REVIEWS ================= */
export const addReview = async (identifier: string, review: ReviewInput, createdBy: string) => {
  const blog = await findBlog(identifier);
  const rating = Number(review.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw AppError.badRequest("Rating must be between 1 and 5");

  blog.reviews.push({
    id: str(review.id) || `BREW-${String(blog.reviews.length + 1).padStart(3, "0")}`,
    comment: str(review.comment),
    rating,
    isActive: review.isActive !== undefined ? toBool(review.isActive) : true,
    isDeleted: false,
    createdBy,
  });
  await blog.save();
  invalidateBlogCaches();
  logger.info(`BLOG_REVIEW_ADDED: ${blog.id}`);
  return blog.populate(POPULATE);
};

export const deleteReview = async (identifier: string, reviewId: string) => {
  const blog = await findBlog(identifier);
  const index = blog.reviews.findIndex((r) => r.id === reviewId || String(r._id) === reviewId);
  if (index === -1) throw AppError.notFound("Review not found");

  blog.reviews.splice(index, 1);
  await blog.save();
  invalidateBlogCaches();
  return { deleted: true, message: "Review deleted successfully" };
};
