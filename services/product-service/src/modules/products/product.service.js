import { models, constants } from "../../../../../shared/index.js";
const { Product } = models;
const { messages } = constants;


export const createProduct = async (data) => {
  const product = await Product.create(data);
  return product;
};

export const getProducts = async (query = {}) => {
  const { categoryId, vendorId, search, status } = query;

  const filter = { isDeleted: false };

  if (categoryId) filter.categoryId = categoryId;
  if (vendorId) filter.vendorId = vendorId;
  if (status) filter.status = status;

  if (search) {
    filter.name = { $regex: search, $options: "i" };
  }

  const products = await Product.find(filter)
    .populate("categoryId", "name slug")
    .sort({ createdAt: -1 });

  return products;
};

export const getProductById = async (id) => {
  const product = await Product.findOne({ _id: id, isDeleted: false })
    .populate("categoryId", "name slug")
    .populate("vendorId", "fullname email");

  if (!product) throw new Error(messages.PRODUCT_NOT_FOUND || "Product not found");
  return product;
};

export const updateProduct = async (id, data) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: data },
    { new: true }
  );

  if (!product) throw new Error(messages.PRODUCT_NOT_FOUND || "Product not found");
  return product;
};

export const deleteProduct = async (id) => {
  const product = await Product.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { $set: { isDeleted: true } },
    { new: true }
  );

  if (!product) throw new Error(messages.PRODUCT_NOT_FOUND || "Product not found");
  return { success: true, message: "Product deleted" };
};
