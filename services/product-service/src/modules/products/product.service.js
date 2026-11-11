import mongoose from "mongoose";
import { utils, models } from "../../../../../shared/index.js";

const { info, buildProductQuery } = utils;
const { Product, Category, ProductCategory = Category, User } = models;

/* ================= RESOLVE CREATOR USER ================= */
const resolveCreatorId = async (providedId) => {
  let val = providedId;
  if (val && typeof val === "object") {
    val = val._id || val.id || val.userId || val.email;
  }
  if (val) {
    const strVal = String(val).trim();
    if (mongoose.Types.ObjectId.isValid(strVal)) {
      const user = await User.findById(strVal).select("_id").lean();
      if (user) return user._id;
    }
    const user = await User.findOne({
      $or: [{ id: strVal }, { email: strVal.toLowerCase() }],
    }).select("_id").lean();
    if (user) return user._id;
  }
  const user = await User.findOne({ isDeleted: false }).select("_id").lean();
  if (user) return user._id;
  return new mongoose.Types.ObjectId("6a86ec15b1a3f595b6ec1bf2");
};

/* ================= RESOLVE CATEGORY ID ================= */
const resolveCategoryId = async (catIdentifier) => {
  if (!catIdentifier) {
    const error = new Error("Category ID is required");
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = mongoose.Types.ObjectId.isValid(catIdentifier);
  const category = await Category.findOne({
    $or: isObjectId
      ? [{ _id: catIdentifier }, { id: catIdentifier }]
      : [{ id: catIdentifier }, { categoryName: String(catIdentifier).trim() }],
    isDeleted: false,
  });

  if (!category) {
    const error = new Error("Category not found or inactive");
    error.statusCode = 404;
    throw error;
  }

  return category._id;
};

/* ================= PARSE ARRAY FIELD ================= */
const parseArray = (field) => {
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return field.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (data = {}) => {
  if (!data.productName || !data.productName.trim()) {
    const error = new Error("Product name is required");
    error.statusCode = 400;
    throw error;
  }

  if (data.price === undefined || data.price === null || isNaN(Number(data.price))) {
    const error = new Error("Valid price is required");
    error.statusCode = 400;
    throw error;
  }

  const categoryId = await resolveCategoryId(data.categoryId);
  const createdBy = await resolveCreatorId(data.createdBy);

  if (data.id && data.id.trim()) {
    const existingId = await Product.findOne({ id: data.id.trim() });
    if (existingId) {
      const error = new Error(`Product with ID ${data.id.trim()} already exists`);
      error.statusCode = 409;
      throw error;
    }
  }

  const product = await Product.create({
    ...(data.id && data.id.trim() ? { id: data.id.trim() } : {}),
    productName: data.productName.trim(),
    description: data.description ? data.description.trim() : "",
    shortDesc: data.shortDesc ? data.shortDesc.trim() : "",
    price: Number(data.price),
    unit: data.unit ? data.unit.trim() : "Pcs",
    currency: data.currency ? data.currency.trim() : "INR",
    totalStock: data.totalStock !== undefined ? Number(data.totalStock) : 0,
    reservedStock: data.reservedStock !== undefined ? Number(data.reservedStock) : 0,
    stockStatus: data.stockStatus !== undefined ? Boolean(data.stockStatus) : true,
    isTrending: data.isTrending !== undefined ? Boolean(data.isTrending) : false,
    severity: data.severity ? data.severity.toLowerCase().trim() : "pending",
    categoryId,
    image: data.image || "",
    images: parseArray(data.images),
    badges: parseArray(data.badges),
    specifications: parseArray(data.specifications),
    reviews: parseArray(data.reviews),
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
    isDeleted: data.isDeleted !== undefined ? Boolean(data.isDeleted) : false,
    createdBy,
  });

  // Increment Category product count
  await Category.findByIdAndUpdate(categoryId, { $inc: { count: 1 } });

  info(`PRODUCT_CREATED: ${product.productName} (${product.id})`);
  return product.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (query = {}) => {
  const {
    isDeleted,
    isActive,
    search,
    categoryId,
    severity,
    isTrending,
    stockStatus,
    page,
    limit,
  } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") {
      filter.isDeleted = isDeleted === "true" || isDeleted === true;
    }
  } else {
    filter.isDeleted = false;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === "true" || isActive === true;
  }

  if (categoryId) {
    if (mongoose.Types.ObjectId.isValid(categoryId)) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    } else {
      const cat = await Category.findOne({ id: categoryId }).select("_id").lean();
      if (cat) filter.categoryId = cat._id;
    }
  }

  if (severity) {
    filter.severity = severity.toLowerCase().trim();
  }

  if (isTrending !== undefined) {
    filter.isTrending = isTrending === "true" || isTrending === true;
  }

  if (stockStatus !== undefined) {
    filter.stockStatus = stockStatus === "true" || stockStatus === true;
  }

  if (search) {
    filter.$or = [
      { id: { $regex: search, $options: "i" } },
      { productName: { $regex: search, $options: "i" } },
      { shortDesc: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const isPaginated = page !== undefined || limit !== undefined;

  let queryBuilder = Product.find(filter)
    .populate("categoryId", "id categoryName count")
    .populate("createdBy", "id fullname email mobile image")
    .populate("reviews.createdBy", "id fullname email mobile image")
    .sort({ createdAt: -1 });

  let currentPage = 1;
  let currentLimit = 10;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;

    total = await Product.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const products = await queryBuilder.lean();

  if (isPaginated) {
    return {
      products,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  return products;
};

/* ================= GET PRODUCT BY ID ================= */
export const getProductById = async (identifier) => {
  const product = await Product.findOne(buildProductQuery(identifier, true))
    .populate("categoryId", "id categoryName count")
    .populate("createdBy", "id fullname email mobile image")
    .populate("reviews.createdBy", "id fullname email mobile image");

  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  return product;
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (identifier, data = {}) => {
  const product = await Product.findOne(buildProductQuery(identifier, true));
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (data.productName) product.productName = data.productName.trim();
  if (data.description !== undefined) product.description = data.description.trim();
  if (data.shortDesc !== undefined) product.shortDesc = data.shortDesc.trim();
  if (data.price !== undefined) product.price = Number(data.price);
  if (data.unit !== undefined) product.unit = data.unit.trim();
  if (data.currency !== undefined) product.currency = data.currency.trim();
  if (data.totalStock !== undefined) product.totalStock = Number(data.totalStock);
  if (data.reservedStock !== undefined) product.reservedStock = Number(data.reservedStock);
  if (data.stockStatus !== undefined) product.stockStatus = data.stockStatus === true || data.stockStatus === "true";
  if (data.isTrending !== undefined) product.isTrending = data.isTrending === true || data.isTrending === "true";
  if (data.severity !== undefined) product.severity = data.severity.toLowerCase().trim();
  if (data.image !== undefined) product.image = data.image;
  if (data.images !== undefined) product.images = parseArray(data.images);
  if (data.badges !== undefined) product.badges = parseArray(data.badges);
  if (data.specifications !== undefined) product.specifications = parseArray(data.specifications);
  if (data.reviews !== undefined) {
    const rawReviews = parseArray(data.reviews);
    product.reviews = rawReviews.map((r) => {
      const creator = r.createdBy?._id || r.createdBy || product.createdBy;
      return {
        id: r.id || `REV-${Date.now()}`,
        comment: r.comment || "",
        rating: Math.max(1, Math.min(5, Number(r.rating || 5))),
        isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
        isDeleted: Boolean(r.isDeleted),
        createdBy: creator,
      };
    });
  }

  // Handle category change
  if (data.categoryId) {
    const newCatId = await resolveCategoryId(data.categoryId);
    if (String(newCatId) !== String(product.categoryId)) {
      if (product.categoryId && !product.isDeleted) {
        await Category.findByIdAndUpdate(product.categoryId, { $inc: { count: -1 } });
      }
      product.categoryId = newCatId;
      if (!product.isDeleted) {
        await Category.findByIdAndUpdate(newCatId, { $inc: { count: 1 } });
      }
    }
  }

  if (data.isActive !== undefined) {
    product.isActive = data.isActive === true || data.isActive === "true";
  }

  if (data.isDeleted !== undefined) {
    const willDelete = data.isDeleted === true || data.isDeleted === "true";
    if (willDelete !== product.isDeleted && product.categoryId) {
      await Category.findByIdAndUpdate(product.categoryId, { $inc: { count: willDelete ? -1 : 1 } });
    }
    product.isDeleted = willDelete;
  }

  if (data.createdBy !== undefined) {
    product.createdBy = await resolveCreatorId(data.createdBy);
  }

  await product.save();
  info(`PRODUCT_UPDATED: ${product.productName} (${product.id})`);
  return product.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (identifier) => {
  const product = await Product.findOne(buildProductQuery(identifier, true));
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (product.isDeleted) {
    await Product.deleteOne({ _id: product._id });
    info(`PRODUCT_PERMANENTLY_DELETED: ${product.productName} (${product.id})`);
    return { deleted: true, message: `Product ${product.productName} permanently removed` };
  }

  product.isDeleted = true;
  await product.save();

  if (product.categoryId) {
    await Category.findByIdAndUpdate(product.categoryId, { $inc: { count: -1 } });
  }

  info(`PRODUCT_DELETED: ${product.productName} (${product.id})`);
  return { deleted: true, message: `Product ${product.productName} deleted successfully` };
};

/* ================= BULK DELETE PRODUCTS ================= */
export const bulkDeleteProduct = async (data) => {
  const ids = Array.isArray(data)
    ? data
    : Array.isArray(data?.ids)
    ? data.ids
    : Array.isArray(data?.productIds)
    ? data.productIds
    : [];

  if (!ids || ids.length === 0) {
    const error = new Error("No product IDs provided for bulk delete");
    error.statusCode = 400;
    throw error;
  }

  const isObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
  const objectIds = ids.filter(isObjectId).map((id) => new mongoose.Types.ObjectId(id));
  const stringIds = ids.map(String);

  const products = await Product.find({
    $or: [{ _id: { $in: objectIds } }, { id: { $in: stringIds } }, { productName: { $in: stringIds } }],
  });

  if (!products || products.length === 0) {
    const error = new Error("No matching products found");
    error.statusCode = 404;
    throw error;
  }

  if (data?.permanent === true || data?.force === true) {
    for (const p of products) {
      if (p.categoryId && !p.isDeleted) {
        await Category.findByIdAndUpdate(p.categoryId, { $inc: { count: -1 } });
      }
    }
    await Product.deleteMany({ _id: { $in: products.map((p) => p._id) } });
    info(`PRODUCTS_PERMANENTLY_BULK_DELETED: ${products.length} products removed`);
    return {
      deleted: true,
      totalCount: products.length,
      message: `${products.length} product(s) permanently deleted`,
    };
  }

  const softDeleteIds = [];
  const hardDeleteIds = [];

  for (const prod of products) {
    if (prod.isDeleted) {
      hardDeleteIds.push(prod._id);
    } else {
      softDeleteIds.push(prod._id);
      if (prod.categoryId) {
        await Category.findByIdAndUpdate(prod.categoryId, { $inc: { count: -1 } });
      }
    }
  }

  if (hardDeleteIds.length > 0) {
    await Product.deleteMany({ _id: { $in: hardDeleteIds } });
  }

  if (softDeleteIds.length > 0) {
    await Product.updateMany({ _id: { $in: softDeleteIds } }, { $set: { isDeleted: true } });
  }

  return {
    deleted: true,
    totalCount: products.length,
    softDeletedCount: softDeleteIds.length,
    permanentlyDeletedCount: hardDeleteIds.length,
    message: `${products.length} product(s) processed (${softDeleteIds.length} moved to trash, ${hardDeleteIds.length} permanently deleted)`,
  };
};

export const bulkDeleteProducts = bulkDeleteProduct;

/* ================= ADD REVIEW ================= */
export const addReview = async (identifier, reviewData = {}) => {
  const product = await Product.findOne(buildProductQuery(identifier, true));
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  if (!reviewData.rating || isNaN(Number(reviewData.rating))) {
    const error = new Error("Valid rating (1-5) is required");
    error.statusCode = 400;
    throw error;
  }

  const createdBy = await resolveCreatorId(reviewData.createdBy);

  const reviewId = `REV-${Date.now()}`;
  product.reviews.push({
    id: reviewId,
    comment: reviewData.comment || "",
    rating: Math.max(1, Math.min(5, Number(reviewData.rating))),
    isActive: true,
    isDeleted: false,
    createdBy,
  });

  await product.save();
  return product.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

/* ================= DELETE REVIEW ================= */
export const deleteReview = async (identifier, reviewId) => {
  const product = await Product.findOne(buildProductQuery(identifier, true));
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  const reviewStr = String(reviewId).trim();
  product.reviews = (product.reviews || []).filter(
    (r) => String(r.id) !== reviewStr && String(r._id) !== reviewStr
  );

  await product.save();
  info(`REVIEW_DELETED: review ${reviewId} from product ${product.id}`);

  return product.populate([
    { path: "categoryId", select: "id categoryName count" },
    { path: "createdBy", select: "id fullname email mobile image" },
    { path: "reviews.createdBy", select: "id fullname email mobile image" },
  ]);
};

