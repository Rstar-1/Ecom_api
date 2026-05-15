import * as service from "./category.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse } = utils;

export const createCategory = asyncHandler(async (req, res) => {
  const data = { 
    ...req.body, 
    createdBy: req.user.id,
    createdByEmail: req.user.email 
  };
  const category = await service.createCategory(data);
  return successResponse(res, category, "Category created", 201);
});

export const getCategories = asyncHandler(async (req, res) => {
  const categories = await service.getCategories(req.query);
  return successResponse(res, categories, "Categories fetched");
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await service.getCategoryById(req.params.id);
  return successResponse(res, category, "Category fetched");
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await service.updateCategory(req.params.id, req.body);
  return successResponse(res, category, "Category updated");
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await service.deleteCategory(req.params.id);
  return successResponse(res, null, "Category deleted");
});
