import type { QueryFilter } from "mongoose";
import { messages } from "../../constants";
import { Product, type IProduct } from "../../models";
import type { AuthUser } from "../../types/express";
import { AppError } from "../../utils";
import { PRODUCT_STATUSES, type ProductBody, type ProductListQuery, type ProductStatus } from "./product.types";

const isProductStatus = (value: string): value is ProductStatus =>
  (PRODUCT_STATUSES as readonly string[]).includes(value);

/** Only these fields may be set by clients (vendorId / isDeleted are server-controlled). */
const pickProductFields = (data: ProductBody): ProductBody => {
  const { name, description, categoryId, images, basePrice, attributes, variants, totalStock, status, isActive } =
    data;
  if (status !== undefined && !isProductStatus(status)) throw AppError.badRequest("Invalid product status");
  return Object.fromEntries(
    Object.entries({
      name,
      description,
      categoryId,
      images,
      basePrice,
      attributes,
      variants,
      totalStock,
      status,
      isActive,
    }).filter(([, v]) => v !== undefined)
  ) as ProductBody;
};

export const createProduct = (data: ProductBody, vendor: AuthUser) => {
  if (!vendor.email) throw AppError.badRequest("Authenticated vendor has no email");

  return Product.create({
    ...pickProductFields(data),
    vendorId: vendor.id,
    vendorEmail: vendor.email,
  });
};

export const getProducts = (query: ProductListQuery = {}) => {
  const { categoryId, vendorId, search, status } = query;

  const filter: QueryFilter<IProduct> = { isDeleted: false };
  if (categoryId) filter.categoryId = categoryId;
  if (vendorId) filter.vendorId = vendorId;
  if (status) {
    if (!isProductStatus(status)) throw AppError.badRequest("Invalid product status");
    filter.status = status;
  }
  if (search) filter.name = { $regex: search, $options: "i" };

  return Product.find(filter).populate("categoryId", "name slug").sort({ createdAt: -1 });
};

export const getProductById = async (id: string) => {
  const product = await Product.findOne({ _id: id, isDeleted: false })
    .populate("categoryId", "name slug")
    .populate("vendorId", "fullname email");
  if (!product) throw AppError.notFound(messages.PRODUCT_NOT_FOUND);
  return product;
};

export const updateProduct = async (id: string, data: ProductBody) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: pickProductFields(data) },
    { new: true, runValidators: true }
  );
  if (!product) throw AppError.notFound(messages.PRODUCT_NOT_FOUND);
  return product;
};

export const deleteProduct = async (id: string): Promise<{ success: true; message: string }> => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );
  if (!product) throw AppError.notFound(messages.PRODUCT_NOT_FOUND);
  return { success: true, message: "Product deleted" };
};
