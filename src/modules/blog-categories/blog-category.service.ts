import { Blog } from "../blogs/blog.model";
import { BlogCategory } from "./blog-category.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  exactCi,
  identifierFilter,
  isPermanent,
  logger,
  pagedResult,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  toNumber,
} from "../../utils";
import { CREATOR_POPULATE } from "../roles/role.helpers";
import type { BlogCategoryBody, BlogCategoryListQuery } from "./blogCategory.types";

const categoryName = (data: BlogCategoryBody) => str(data.categoryName || data.name);

const findCategory = async (identifier: string) => {
  const category = await BlogCategory.findOne(identifierFilter(identifier, (v) => [{ categoryName: exactCi(v) }]));
  if (!category) throw AppError.notFound("Category not found");
  return category;
};

const blogCountsByCategory = async (): Promise<Map<string, number>> => {
  const counts = await Blog.aggregate<{ _id: unknown; count: number }>([
    { $match: { isDeleted: false } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
};

export const createBlogCategory = async (data: BlogCategoryBody, createdBy: string) => {
  const name = categoryName(data);
  if (!name) throw AppError.badRequest("Category name is required");

  const existing = await BlogCategory.findOne({ categoryName: exactCi(name) });
  if (existing) {
    existing.isDeleted = false;
    existing.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
    if (data.count !== undefined) existing.count = toNumber(data.count);
    if (createdBy) existing.createdBy = createdBy as any;
    await existing.save();
    logger.info(`BLOG_CATEGORY_UPDATED: ${existing.categoryName} (${existing.id})`);
    return existing.populate("createdBy", CREATOR_POPULATE);
  }

  const id = str(data.id);
  const category = await BlogCategory.create({
    ...(id ? { id } : {}),
    categoryName: name,
    count: toNumber(data.count),
    isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
    createdBy,
  });
  logger.info(`BLOG_CATEGORY_CREATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", CREATOR_POPULATE);
};

export const getBlogCategories = async (query: BlogCategoryListQuery = {}) => {
  const filter = { ...baseListFilter(query), ...searchFilter(query.search, ["id", "categoryName"]) };
  const paging = readPagination(query, 10);
  const countMap = await blogCountsByCategory();

  const base = BlogCategory.find(filter).populate("createdBy", CREATOR_POPULATE).sort({ createdAt: -1 });
  const [categories, total] = await Promise.all([
    (paging.isPaginated ? base.skip(paging.skip).limit(paging.limit) : base).lean(),
    paging.isPaginated ? BlogCategory.countDocuments(filter) : Promise.resolve(0),
  ]);

  const withCounts = categories.map((c) => ({ ...c, count: countMap.get(String(c._id)) ?? c.count ?? 0 }));
  return paging.isPaginated ? pagedResult("categories", withCounts, total, paging) : withCounts;
};

export const getBlogCategoryById = async (identifier: string) => {
  const category = await findCategory(identifier);
  await category.populate("createdBy", CREATOR_POPULATE);
  const count = await Blog.countDocuments({ categoryId: category._id, isDeleted: false });
  return { ...category.toObject(), count };
};

export const updateBlogCategory = async (identifier: string, data: BlogCategoryBody) => {
  const category = await findCategory(identifier);

  const name = categoryName(data);
  if (name) category.categoryName = name;

  const newId = str(data.id);
  if (newId && newId !== category.id) {
    if (await BlogCategory.exists({ id: newId, _id: { $ne: category._id } })) {
      throw AppError.conflict(`Blog category id '${newId}' is already taken`);
    }
    category.id = newId;
  }

  if (data.count !== undefined) category.count = toNumber(data.count);
  if (data.isActive !== undefined) category.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) category.isDeleted = toBool(data.isDeleted);

  await category.save();
  logger.info(`BLOG_CATEGORY_UPDATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", CREATOR_POPULATE);
};

export const deleteBlogCategory = async (identifier: string) => {
  const category = await findCategory(identifier);
  const hasBlogs = await Blog.exists({ categoryId: category._id, isDeleted: false });
  if (hasBlogs) throw AppError.badRequest("Cannot delete category with associated blogs");

  category.isDeleted = true;
  await category.save();
  logger.info(`BLOG_CATEGORY_DELETED: ${category.categoryName} (${category.id})`);
  return { message: "Category deleted successfully" };
};

export const bulkDeleteBlogCategories = async (body: unknown) => {
  const ids = readBulkIds(body);
  if (!ids.length) throw AppError.badRequest("No category IDs provided");
  const permanent = isPermanent(body);

  const targetCategories = await BlogCategory.find(bulkFilter(ids)).select("_id");
  const targetIds = targetCategories.map((c) => c._id);

  const blogsInUse = await Blog.distinct("categoryId", { categoryId: { $in: targetIds }, isDeleted: false });
  const inUseSet = new Set(blogsInUse.map((id) => String(id)));
  const safeToDelete = targetIds.filter((id) => !inUseSet.has(String(id)));

  if (!safeToDelete.length) {
    throw AppError.badRequest("None of the selected categories can be deleted because they have active blogs");
  }

  const deleteFilter = { _id: { $in: safeToDelete } };
  const result = permanent
    ? await BlogCategory.deleteMany(deleteFilter)
    : await BlogCategory.updateMany(deleteFilter, { $set: { isDeleted: true } });

  const count = "modifiedCount" in result ? result.modifiedCount : (result as { deletedCount?: number }).deletedCount ?? 0;
  return {
    deletedCount: count,
    skippedCount: targetIds.length - safeToDelete.length,
    permanent,
  };
};
