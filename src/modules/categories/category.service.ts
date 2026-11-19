import type { QueryFilter } from "mongoose";
import { Category, type ICategory } from "../../models";
import type { AuthUser } from "../../types/express";
import { AppError } from "../../utils";
import type { CategoryBody, CategoryListQuery } from "./category.types";

/** Only these fields may be set by clients (createdBy / isDeleted are server-controlled). */
const pickCategoryFields = (data: CategoryBody): CategoryBody => {
  const { name, slug, parentId, attributes, isActive } = data;
  return Object.fromEntries(
    Object.entries({ name, slug, parentId, attributes, isActive }).filter(([, v]) => v !== undefined)
  ) as CategoryBody;
};

export const createCategory = (data: CategoryBody, user: AuthUser) => {
  if (!data.name?.trim()) throw AppError.badRequest("Category name is required");
  if (!data.slug?.trim()) throw AppError.badRequest("Category slug is required");
  if (!user.email) throw AppError.badRequest("Authenticated user has no email");

  return Category.create({
    ...pickCategoryFields(data),
    createdBy: user.id,
    createdByEmail: user.email,
  });
};

export const getCategories = (query: CategoryListQuery = {}) => {
  const filter: QueryFilter<ICategory> = { isDeleted: false };
  if (query.parentId) filter.parentId = query.parentId;
  return Category.find(filter).sort({ name: 1 });
};

export const getCategoryById = async (id: string) => {
  const category = await Category.findOne({ _id: id, isDeleted: false });
  if (!category) throw AppError.notFound("Category not found");
  return category;
};

export const updateCategory = async (id: string, data: CategoryBody) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: pickCategoryFields(data) },
    { new: true, runValidators: true }
  );
  if (!category) throw AppError.notFound("Category not found");
  return category;
};

export const deleteCategory = async (id: string): Promise<{ success: true }> => {
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!category) throw AppError.notFound("Category not found");
  return { success: true };
};
