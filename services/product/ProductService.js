// -------------------------------------------- IMPORTS -------------------------------------------- //
import Product from "../../models/product/ProductSchema.js";
import Log from "../../models/log/LogSchema.js";

// -------------------------------------------- HELPERS -------------------------------------------- //
const logEvent = async (title, status, message, userId) => {
  await Log.create({ title, status, message, userId: userId || null });
};

// -------------------------------------------- PRODUCT SERVICE -------------------------------------------- //

// CREATE PRODUCT
export const createProduct = async (data, user) => {
  try {
    const newProduct = await Product.create({ ...data, createdBy: user.id });
    await logEvent(user.fullname, "SUCCESS", `Product created: ${newProduct._id}`, user.id);
    return newProduct;
  } catch (err) {
    await logEvent("Create Product", "FAILURE", err.message, user?.id);
    throw err;
  }
};

// GET PRODUCT LIST
export const getProduct = async ({ offset = 0, pagination = true, search = {}, sortKey = "createdAt", sortDirection = "desc" }) => {
  try {
    const searchObject = {};
    for (const key in search) if (search[key]) searchObject[key] = { $regex: search[key], $options: "i" };

    let query = Product.find(searchObject).populate("createdBy", "fullname role");
    query = query.sort({ [sortKey]: sortDirection === "desc" ? -1 : 1 });

    const totalCount = await Product.countDocuments(searchObject);
    const productstore = pagination ? await query.skip(Number(offset)).limit(10) : await query;

    return { productstore, totalCount };
  } catch (err) {
    throw err;
  }
};

// GET SINGLE PRODUCT
export const singleProduct = async (id) => {
  const product = await Product.findById(id)
    .populate("createdBy", "fullname role")
    .populate("reviews.userId", "fullname");
  if (!product) throw new Error("Product not found");
  return product;
};

// UPDATE PRODUCT
export const updateProduct = async (id, data, user) => {
  try {
    const updated = await Product.findByIdAndUpdate(id, data, { new: true });
    if (!updated) throw new Error("Product not found");

    await logEvent(user.fullname, "SUCCESS", `Product updated: ${updated._id}`, user.id);
    return updated;
  } catch (err) {
    await logEvent("Update Product", "FAILURE", err.message, user?.id);
    throw err;
  }
};

// UPDATE STATUS
export const statusProduct = async (id, status, user) => {
  try {
    const updated = await Product.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) throw new Error("Product not found");

    await logEvent(user.fullname, "SUCCESS", `Status updated: ${id}`, user.id);
    return updated;
  } catch (err) {
    await logEvent("Status Update", "FAILURE", err.message, user?.id);
    throw err;
  }
};

// DELETE PRODUCT
export const deleteProduct = async (id, user) => {
  const deleted = await Product.findByIdAndDelete(id);
  if (!deleted) throw new Error("Product not found");

  await logEvent(user.fullname, "SUCCESS", `Deleted: ${id}`, user.id);
  return deleted;
};