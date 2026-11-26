import { Blog } from "../blogs/blog.model";
import { BlogCategory } from "./blog-category.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
  cache,
  exactCi,
  identifierFilter,
  isPermanent,
  logger,
  nextSequentialId,
  pagedResult,
  readBulkIds,
  readPagination,
  searchFilter,
  str,
  toBool,
  toNumber,
} from "../../utils";
import { CREATOR_POPULATE, getRoleBasedCreatorFilter } from "../roles/role.helpers";
import type { BlogCategoryBody, BlogCategoryListQuery } from "./blogCategory.types";

const categoryName = (data: BlogCategoryBody) => str(data.categoryName || data.name);

const findCategory = async (identifier: string) => {
  const category = await BlogCategory.findOne(identifierFilter(identifier, (v) => [{ categoryName: exactCi(v) }]));
  if (!category) throw AppError.notFound("Category not found");
  return category;
};

export const createBlogCategory = async (data: BlogCategoryBody, createdBy: string) => {
  const name = categoryName(data);
  if (!name) throw AppError.badRequest("Category name is required");

  const existing = await BlogCategory.findOne({
    $or: [
      { categoryName: exactCi(name) },
      ...(data.id ? [{ id: str(data.id) }] : []),
    ],
  });

  if (existing) {
    existing.isDeleted = false;
    existing.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
    if (data.count !== undefined) existing.count = toNumber(data.count);
    if (createdBy) existing.createdBy = createdBy as any;
    await existing.save();
    cache.invalidate("blog_categories");
    cache.invalidate("blog_categories_counts");
    cache.invalidate("blog_categories_status_counts");
    logger.info(`BLOG_CATEGORY_UPDATED: ${existing.categoryName} (${existing.id})`);
    try {
      await existing.populate("createdBy", CREATOR_POPULATE);
    } catch {}
    return existing;
  }

  const id = str(data.id);
  try {
    const category = await BlogCategory.create({
      ...(id ? { id } : {}),
      categoryName: name,
      count: toNumber(data.count),
      isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
      createdBy,
    });
    cache.invalidate("blog_categories");
    cache.invalidate("blog_categories_counts");
    cache.invalidate("blog_categories_status_counts");
    logger.info(`BLOG_CATEGORY_CREATED: ${category.categoryName} (${category.id})`);
    try {
      await category.populate("createdBy", CREATOR_POPULATE);
    } catch {}
    return category;
  } catch (err: any) {
    if (err?.code === 11000) {
      const conflict = await BlogCategory.findOne({
        $or: [{ categoryName: exactCi(name) }, ...(id ? [{ id }] : [])],
      });
      if (conflict) {
        conflict.isDeleted = false;
        conflict.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
        if (data.count !== undefined) conflict.count = toNumber(data.count);
        await conflict.save();
        try {
          await conflict.populate("createdBy", CREATOR_POPULATE);
        } catch {}
        return conflict;
      }
      const retryId = await nextSequentialId("blogcategories", "BCAT");
      const retry = await BlogCategory.create({
        id: retryId,
        categoryName: name,
        count: toNumber(data.count),
        isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
        createdBy,
      });
      try {
        await retry.populate("createdBy", CREATOR_POPULATE);
      } catch {}
      return retry;
    }
    throw err;
  }
};

export const getBlogCategories = async (query: BlogCategoryListQuery = {}) => {
  return cache.wrap(
    "blog_categories",
    query as Record<string, unknown>,
    async () => {
      const filter = { ...baseListFilter(query), ...searchFilter(query.search, ["id", "categoryName"]) };
      const creatorFilter = await getRoleBasedCreatorFilter(query.userId || query.createdBy);
      if (Object.keys(creatorFilter).length) {
        Object.assign(filter, creatorFilter);
      }
      const paging = readPagination(query, 10, true);

      const [categories, total, active, inactive, trash] = await Promise.all([
        BlogCategory.find(filter)
          .select("id categoryName count isActive isDeleted createdBy createdAt updatedAt")
          .populate("createdBy", CREATOR_POPULATE)
          .sort({ createdAt: -1 })
          .skip(paging.skip)
          .limit(paging.limit)
          .lean(),
        BlogCategory.countDocuments(filter),
        BlogCategory.countDocuments({ ...filter, isDeleted: false, isActive: true }),
        BlogCategory.countDocuments({ ...filter, isDeleted: false, isActive: false }),
        BlogCategory.countDocuments({ ...filter, isDeleted: true }),
      ]);

      const result: any = pagedResult("categories", categories, total, paging);
      result.counts = { all: active + inactive, active, inactive, trash };
      return result;
    },
    60
  );
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
  cache.invalidate("blog_categories");
  cache.invalidate("blog_categories_counts");
  logger.info(`BLOG_CATEGORY_UPDATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", CREATOR_POPULATE);
};

export const deleteBlogCategory = async (identifier: string, permanent: boolean = false) => {
  const category = await findCategory(identifier);
  const hasBlogs = await Blog.exists({ categoryId: category._id, isDeleted: false });
  if (hasBlogs) throw AppError.badRequest("Cannot delete category with associated blogs");

  if (permanent || category.isDeleted) {
    await BlogCategory.deleteOne({ _id: category._id });
    cache.invalidate("blog_categories");
    cache.invalidate("blog_categories_counts");
    cache.invalidate("blog_categories_status_counts");
    logger.info(`BLOG_CATEGORY_PERMANENTLY_DELETED: ${category.categoryName} (${category.id})`);
    return { deleted: true, message: "Category permanently deleted successfully" };
  }

  category.isDeleted = true;
  await category.save();
  cache.invalidate("blog_categories");
  cache.invalidate("blog_categories_counts");
  cache.invalidate("blog_categories_status_counts");
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

  cache.invalidate("blog_categories");
  cache.invalidate("blog_categories_counts");
  cache.invalidate("blog_categories_status_counts");

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
