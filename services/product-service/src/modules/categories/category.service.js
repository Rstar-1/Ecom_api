import { models } from "../../../../../shared/index.js";
const { Category } = models;

export const createCategory = async (data) => {
  const category = await Category.create(data);
  return category;
};

export const getCategories = async (query = {}) => {
  const filter = { isDeleted: false };
  if (query.parentId) filter.parentId = query.parentId;
  
  const categories = await Category.find(filter).sort({ name: 1 });
  return categories;
};

export const getCategoryById = async (id) => {
  const category = await Category.findOne({ _id: id, isDeleted: false });
  if (!category) throw new Error("Category not found");
  return category;
};

export const updateCategory = async (id, data) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: data },
    { new: true }
  );
  if (!category) throw new Error("Category not found");
  return category;
};

export const deleteCategory = async (id) => {
  const category = await Category.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!category) throw new Error("Category not found");
  return { success: true };
};
