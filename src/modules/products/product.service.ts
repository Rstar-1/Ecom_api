import mongoose from "mongoose";
import {
  PRODUCT_SEVERITIES,
  Product,
  type ReviewInput,
  type SpecificationInput,
} from "./product.model";
import { ProductCategory } from "../categories/category.model";
import {
  AppError,
  baseListFilter,
  bulkFilter,
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
  toNumber,
  type Filter,
} from "../../utils";
import { CREATOR_POPULATE } from "../roles/role.helpers";
import type { ProductBody, ProductListQuery } from "./product.types";

const POPULATE = [
  { path: "categoryId", select: "id categoryName count" },
  { path: "createdBy", select: CREATOR_POPULATE },
  { path: "reviews.createdBy", select: CREATOR_POPULATE },
];

type Severity = (typeof PRODUCT_SEVERITIES)[number];
const toSeverity = (value: unknown): Severity => {
  const sev = str(value).toLowerCase();
  if (!(PRODUCT_SEVERITIES as readonly string[]).includes(sev)) {
    throw AppError.badRequest(`Severity must be one of: ${PRODUCT_SEVERITIES.join(", ")}`);
  }
  return sev as Severity;
};

const findProduct = async (identifier: string) => {
  const product = await Product.findOne(identifierFilter(identifier, (v) => [{ productName: exactCi(v) }]));
  if (!product) throw AppError.notFound("Product not found");
  return product;
};

/** Category by Mongo _id, PCAT-001 or name (must exist and not be deleted). */
const resolveCategoryId = async (identifier: unknown) => {
  const value = str(identifier);
  if (!value) throw AppError.badRequest("Category ID is required");
  const category = await ProductCategory.findOne({
    ...identifierFilter(value, (v) => [{ categoryName: v }]),
    isDeleted: false,
  });
  if (!category) throw AppError.notFound("Category not found or inactive");
  return category._id;
};

const changeCategoryCount = (categoryId: unknown, by: 1 | -1) =>
  categoryId ? ProductCategory.updateOne({ _id: categoryId }, { $inc: { count: by } }) : Promise.resolve();

const toReview = (r: ReviewInput & { createdBy?: unknown }, fallbackCreator: unknown) => ({
  id: str(r.id) || `REV-${Date.now()}`,
  comment: str(r.comment),
  rating: Math.max(1, Math.min(5, toNumber(r.rating, 5))),
  isActive: r.isActive !== undefined ? toBool(r.isActive) : true,
  isDeleted: toBool(r.isDeleted),
  createdBy: r.createdBy ?? fallbackCreator,
});

/* ================= CREATE ================= */
export const createProduct = async (data: ProductBody, createdBy: string) => {
  const productName = str(data.productName);
  if (!productName) throw AppError.badRequest("Product name is required");
  if (data.price === undefined || data.price === "" || !Number.isFinite(Number(data.price))) {
    throw AppError.badRequest("Valid price is required");
  }

  const categoryId = await resolveCategoryId(data.categoryId);
  const id = str(data.id);
  if (id && (await Product.exists({ id }))) throw AppError.conflict(`Product with ID ${id} already exists`);

  const product = await Product.create({
    ...(id ? { id } : {}),
    productName,
    description: str(data.description),
    shortDesc: str(data.shortDesc),
    price: Number(data.price),
    unit: str(data.unit) || "Pcs",
    currency: str(data.currency) || "INR",
    totalStock: toNumber(data.totalStock),
    reservedStock: toNumber(data.reservedStock),
    stockStatus: data.stockStatus !== undefined ? toBool(data.stockStatus) : true,
    isTrending: toBool(data.isTrending),
    severity: data.severity ? toSeverity(data.severity) : "pending",
    categoryId,
    image: data.image ?? "",
    images: parseList(data.images),
    badges: parseList(data.badges),
    specifications: parseList<SpecificationInput>(data.specifications),
    reviews: parseList<ReviewInput>(data.reviews).map((r) => toReview(r, createdBy)),
    isActive: data.isActive !== undefined ? toBool(data.isActive) : true,
    createdBy,
  });

  await changeCategoryCount(categoryId, 1);
  logger.info(`PRODUCT_CREATED: ${product.productName} (${product.id})`);
  return product.populate(POPULATE);
};

/* ================= LIST ================= */
export const getProducts = async (query: ProductListQuery = {}) => {
  const filter: Filter = {
    ...baseListFilter(query),
    ...searchFilter(query.search, ["id", "productName", "shortDesc", "description"]),
  };

  if (query.categoryId) {
    if (isObjectId(query.categoryId)) filter.categoryId = new mongoose.Types.ObjectId(query.categoryId);
    else {
      const cat = await ProductCategory.findOne({ id: query.categoryId }).select("_id").lean();
      filter.categoryId = cat?._id ?? new mongoose.Types.ObjectId(); // unknown category -> no results
    }
  }
  if (query.severity) filter.severity = toSeverity(query.severity);
  if (query.isTrending !== undefined) filter.isTrending = toBool(query.isTrending);
  if (query.stockStatus !== undefined) filter.stockStatus = toBool(query.stockStatus);

  const paging = readPagination(query, 10);
  const base = Product.find(filter).populate(POPULATE).sort({ createdAt: -1 });
  const [products, total] = await Promise.all([
    (paging.isPaginated ? base.skip(paging.skip).limit(paging.limit) : base).lean(),
    paging.isPaginated ? Product.countDocuments(filter) : Promise.resolve(0),
  ]);

  return paging.isPaginated ? pagedResult("products", products, total, paging) : products;
};

/* ================= GET ONE (Mongo _id, PROD-001 or name) ================= */
export const getProductById = async (identifier: string) => (await findProduct(identifier)).populate(POPULATE);

/* ================= UPDATE ================= */
export const updateProduct = async (identifier: string, data: ProductBody) => {
  const product = await findProduct(identifier);

  if (str(data.productName)) product.productName = str(data.productName);
  if (data.description !== undefined) product.description = str(data.description);
  if (data.shortDesc !== undefined) product.shortDesc = str(data.shortDesc);
  if (data.price !== undefined) {
    if (!Number.isFinite(Number(data.price))) throw AppError.badRequest("Valid price is required");
    product.price = Number(data.price);
  }
  if (data.unit !== undefined) product.unit = str(data.unit);
  if (data.currency !== undefined) product.currency = str(data.currency);
  if (data.totalStock !== undefined) product.totalStock = toNumber(data.totalStock);
  if (data.reservedStock !== undefined) product.reservedStock = toNumber(data.reservedStock);
  if (data.stockStatus !== undefined) product.stockStatus = toBool(data.stockStatus);
  if (data.isTrending !== undefined) product.isTrending = toBool(data.isTrending);
  if (data.severity !== undefined) product.severity = toSeverity(data.severity);
  if (data.image !== undefined) product.image = data.image;
  if (data.images !== undefined) product.set("images", parseList(data.images));
  if (data.badges !== undefined) product.set("badges", parseList(data.badges));
  if (data.specifications !== undefined) {
    product.set("specifications", parseList<SpecificationInput>(data.specifications));
  }
  if (data.reviews !== undefined) {
    product.set(
      "reviews",
      parseList<ReviewInput>(data.reviews).map((r) => toReview(r, product.createdBy))
    );
  }

  if (data.categoryId) {
    const newCategoryId = await resolveCategoryId(data.categoryId);
    if (!newCategoryId.equals(product.categoryId)) {
      if (!product.isDeleted) {
        await changeCategoryCount(product.categoryId, -1);
        await changeCategoryCount(newCategoryId, 1);
      }
      product.categoryId = newCategoryId;
    }
  }

  if (data.isActive !== undefined) product.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) {
    const willDelete = toBool(data.isDeleted);
    if (willDelete !== product.isDeleted) await changeCategoryCount(product.categoryId, willDelete ? -1 : 1);
    product.isDeleted = willDelete;
  }

  await product.save();
  logger.info(`PRODUCT_UPDATED: ${product.productName} (${product.id})`);
  return product.populate(POPULATE);
};

/* ================= DELETE (soft first, permanent if already in trash) ================= */
export const deleteProduct = async (identifier: string) => {
  const product = await findProduct(identifier);

  if (product.isDeleted) {
    await Product.deleteOne({ _id: product._id });
    logger.info(`PRODUCT_PERMANENTLY_DELETED: ${product.productName} (${product.id})`);
    return { deleted: true, message: `Product ${product.productName} permanently removed` };
  }

  product.isDeleted = true;
  await product.save();
  await changeCategoryCount(product.categoryId, -1);
  logger.info(`PRODUCT_DELETED: ${product.productName} (${product.id})`);
  return { deleted: true, message: `Product ${product.productName} deleted successfully` };
};

/* ================= BULK DELETE ================= */
export const bulkDeleteProducts = async (body: unknown) => {
  const ids = readBulkIds(body, "productIds");
  const matched = await Product.find(bulkFilter(ids, ["productName"]));
  if (matched.length === 0) throw AppError.notFound("No matching products found");

  const active = matched.filter((p) => !p.isDeleted);
  await Promise.all(active.map((p) => changeCategoryCount(p.categoryId, -1)));

  if (isPermanent(body)) {
    await Product.deleteMany({ _id: { $in: matched.map((p) => p._id) } });
    return { deleted: true, totalCount: matched.length, message: `${matched.length} product(s) permanently deleted` };
  }

  const hardIds = matched.filter((p) => p.isDeleted).map((p) => p._id);
  const softIds = active.map((p) => p._id);
  if (hardIds.length) await Product.deleteMany({ _id: { $in: hardIds } });
  if (softIds.length) await Product.updateMany({ _id: { $in: softIds } }, { $set: { isDeleted: true } });

  return {
    deleted: true,
    totalCount: matched.length,
    softDeletedCount: softIds.length,
    permanentlyDeletedCount: hardIds.length,
    message: `${matched.length} product(s) processed (${softIds.length} moved to trash, ${hardIds.length} permanently deleted)`,
  };
};

/* ================= REVIEWS ================= */
export const addReview = async (identifier: string, review: ReviewInput, createdBy: string) => {
  const product = await findProduct(identifier);
  const rating = Number(review.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw AppError.badRequest("Valid rating (1-5) is required");

  product.reviews.push(toReview({ ...review, id: `REV-${Date.now()}`, isDeleted: false }, createdBy));
  await product.save();
  return product.populate(POPULATE);
};

export const deleteReview = async (identifier: string, reviewId: string) => {
  const product = await findProduct(identifier);
  const index = product.reviews.findIndex((r) => r.id === reviewId || String(r._id) === reviewId);
  if (index === -1) throw AppError.notFound("Review not found");

  product.reviews.splice(index, 1);
  await product.save();
  logger.info(`REVIEW_DELETED: ${reviewId} from product ${product.id}`);
  return product.populate(POPULATE);
};
