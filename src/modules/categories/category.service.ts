import { Product, ProductCategory } from "../../models";
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
import type { CategoryBody, CategoryListQuery } from "./category.types";

const categoryName = (data: CategoryBody) => str(data.categoryName || data.name);

const findCategory = async (identifier: string) => {
  const category = await ProductCategory.findOne(identifierFilter(identifier, (v) => [{ categoryName: exactCi(v) }]));
  if (!category) throw AppError.notFound("Category not found");
  return category;
};

/** Live number of non-deleted products per category. */
const productCountsByCategory = async (): Promise<Map<string, number>> => {
  const counts = await Product.aggregate<{ _id: unknown; count: number }>([
    { $match: { isDeleted: false } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
};

/* ================= CREATE (restores a soft-deleted category with the same name) ================= */
export const createCategory = async (data: CategoryBody, createdBy: string) => {
  const name = categoryName(data);
  if (!name) throw AppError.badRequest("Category name is required");

  const existing = await ProductCategory.findOne({ categoryName: name });
  if (existing) {
    if (!existing.isDeleted) throw AppError.conflict(`Category "${name}" already exists`);
    existing.isDeleted = false;
    existing.isActive = data.isActive !== undefined ? toBool(data.isActive) : true;
    if (data.description !== undefined) existing.description = str(data.description);
    if (data.image !== undefined) existing.image = data.image;
    if (data.iconName !== undefined) existing.iconName = str(data.iconName);
    await existing.save();
    logger.info(`CATEGORY_RESTORED_AND_UPDATED: ${existing.categoryName} (${existing.id})`);
    return existing;
  }

  const id = str(data.id);
  if (id && (await ProductCategory.exists({ id }))) throw AppError.conflict(`Category with ID ${id} already exists`);

  const slug = (str(data.slug) || name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const category = await ProductCategory.create({
    ...(id ? { id } : {}),
    categoryName: name,
    slug,
    description: str(data.description),
    image: data.image ?? "",
    iconName: str(data.iconName),
    count: toNumber(data.count),
    isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
    createdBy,
  });
  logger.info(`CATEGORY_CREATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", CREATOR_POPULATE);
};

/* ================= LIST ================= */
export const getCategories = async (query: CategoryListQuery = {}) => {
  const filter = { ...baseListFilter(query), ...searchFilter(query.search, ["id", "categoryName", "description"]) };
  const paging = readPagination(query, 10);
  const countMap = await productCountsByCategory();

  const base = ProductCategory.find(filter).populate("createdBy", CREATOR_POPULATE).sort({ createdAt: -1 });
  const [categories, total] = await Promise.all([
    (paging.isPaginated ? base.skip(paging.skip).limit(paging.limit) : base).lean(),
    paging.isPaginated ? ProductCategory.countDocuments(filter) : Promise.resolve(0),
  ]);

  const withCounts = categories.map((c) => ({ ...c, count: countMap.get(String(c._id)) ?? c.count ?? 0 }));
  return paging.isPaginated ? pagedResult("categories", withCounts, total, paging) : withCounts;
};

/* ================= GET ONE (Mongo _id, PCAT-001 or name) ================= */
export const getCategoryById = async (identifier: string) => {
  const category = await findCategory(identifier);
  await category.populate("createdBy", CREATOR_POPULATE);
  const count = await Product.countDocuments({ categoryId: category._id, isDeleted: false });
  return { ...category.toObject(), count };
};

/* ================= UPDATE ================= */
export const updateCategory = async (identifier: string, data: CategoryBody) => {
  const category = await findCategory(identifier);

  const name = categoryName(data);
  if (name) {
    if (await ProductCategory.exists({ categoryName: name, _id: { $ne: category._id }, isDeleted: false })) {
      throw AppError.conflict(`Category "${name}" already exists`);
    }
    category.categoryName = name;
  }

  const newId = str(data.id);
  if (newId && newId !== category.id) {
    if (await ProductCategory.exists({ id: newId, _id: { $ne: category._id } })) {
      throw AppError.conflict(`Category with ID ${newId} already exists`);
    }
    category.id = newId;
  }

  if (data.description !== undefined) category.description = str(data.description);
  if (data.slug !== undefined) category.slug = str(data.slug);
  else if (name) category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (data.image !== undefined) category.image = data.image;
  if (data.iconName !== undefined) category.iconName = str(data.iconName);
  if (data.count !== undefined) category.count = Math.max(0, toNumber(data.count));
  if (data.isActive !== undefined) category.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) category.isDeleted = toBool(data.isDeleted);

  await category.save();
  logger.info(`CATEGORY_UPDATED: ${category.categoryName} (${category.id})`);
  return category.populate("createdBy", CREATOR_POPULATE);
};

/* ================= DELETE (soft first, permanent if already in trash) ================= */
export const deleteCategory = async (identifier: string) => {
  const category = await findCategory(identifier);

  if (category.isDeleted) {
    await ProductCategory.deleteOne({ _id: category._id });
    logger.info(`CATEGORY_PERMANENTLY_DELETED: ${category.categoryName} (${category.id})`);
    return { deleted: true, message: `Category ${category.categoryName} permanently removed` };
  }

  category.isDeleted = true;
  await category.save();
  logger.info(`CATEGORY_DELETED: ${category.categoryName} (${category.id})`);
  return { deleted: true, message: `Category ${category.categoryName} deleted successfully` };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteCategories = async (body: unknown) => {
  const ids = readBulkIds(body, "categoryIds");
  const matched = await ProductCategory.find(bulkFilter(ids, ["categoryName"]));
  if (matched.length === 0) throw AppError.notFound("No matching categories found");

  if (isPermanent(body)) {
    await ProductCategory.deleteMany({ _id: { $in: matched.map((c) => c._id) } });
    return { deleted: true, totalCount: matched.length, message: `${matched.length} category(s) permanently deleted` };
  }

  const hardIds = matched.filter((c) => c.isDeleted).map((c) => c._id);
  const softIds = matched.filter((c) => !c.isDeleted).map((c) => c._id);
  if (hardIds.length) await ProductCategory.deleteMany({ _id: { $in: hardIds } });
  if (softIds.length) await ProductCategory.updateMany({ _id: { $in: softIds } }, { $set: { isDeleted: true } });

  return {
    deleted: true,
    totalCount: matched.length,
    softDeletedCount: softIds.length,
    permanentlyDeletedCount: hardIds.length,
    message: `${matched.length} category(s) processed (${softIds.length} moved to trash, ${hardIds.length} permanently deleted)`,
  };
};
