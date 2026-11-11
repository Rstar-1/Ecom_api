import mongoose from "mongoose";
import {
  Role,
  User,
  Category,
  ProductCategory,
  Product,
  BlogCategory,
  Blog,
  Lead,
  CMS,
  SEO,
} from "../models/index.js";

/* ================= ADDRESS ================= */
export const parseAddress = (address) => {
  if (!address) return ["", ""];
  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      if (Array.isArray(parsed)) return parsed.map(String);
      return [String(address), ""];
    } catch {
      return [String(address), ""];
    }
  }
  if (Array.isArray(address)) {
    return address.map((a) =>
      typeof a === "object" && a !== null ? Object.values(a).filter(Boolean).join(", ") : String(a)
    );
  }
  return ["", ""];
};

/* ================= OBJECT MERGE ================= */
export const mergeObjects = (oldObj, newObj) => {
  return { ...(oldObj || {}), ...(newObj || {}) };
};

/* ================= ROLE HELPERS ================= */
export const validateRole = async (rolename) => {
  if (!rolename) return "customer";

  const exists = await Role.findOne({
    rolename: rolename.trim().toLowerCase(),
    isDeleted: false,
    isActive: true,
  });

  if (!exists) {
    throw new Error("Invalid role");
  }

  return rolename.trim().toLowerCase();
};

export const resolveRole = async ({ roleId, rolename, role } = {}) => {
  if (roleId && mongoose.Types.ObjectId.isValid(roleId)) {
    const roleDoc = await Role.findOne({ _id: roleId, isDeleted: false });
    if (roleDoc) return roleDoc;
  }

  const name = (rolename || role || "customer").trim().toLowerCase();
  let roleDoc = await Role.findOne({ rolename: name, isDeleted: false });
  if (roleDoc) return roleDoc;

  // Fallback to customer or first active role
  roleDoc = await Role.findOne({ rolename: "customer", isDeleted: false });
  if (roleDoc) return roleDoc;

  return Role.findOne({ isDeleted: false });
};

export const generateRoleId = async () => {
  const roles = await Role.find({ id: /^ROLE-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const r of roles) {
    const match = r.id?.match(/^ROLE-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `ROLE-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildRoleQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { rolename: str.toLowerCase() }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= USER HELPERS ================= */
export const generateUserId = async () => {
  const users = await User.find({ id: /^USER-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const u of users) {
    const match = u.id?.match(/^USER-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `USER-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildUserQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { email: str.toLowerCase() },
          { mobile: str },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= PRODUCT CATEGORY HELPERS ================= */
export const generateProductCategoryId = async () => {
  const categories = await ProductCategory.find({ id: /^PCAT-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const c of categories) {
    const match = c.id?.match(/^PCAT-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `PCAT-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildProductCategoryQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { categoryName: str }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

// Aliases for Category backward compatibility
export const generateCategoryId = generateProductCategoryId;
export const buildCategoryQuery = buildProductCategoryQuery;

/* ================= PRODUCT HELPERS ================= */
export const generateProductId = async () => {
  const products = await Product.find({ id: /^PROD-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const p of products) {
    const match = p.id?.match(/^PROD-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `PROD-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildProductQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { productName: str }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= BLOG CATEGORY HELPERS ================= */
export const generateBlogCategoryId = async () => {
  const categories = await BlogCategory.find({ id: /^BCAT-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const c of categories) {
    const match = c.id?.match(/^BCAT-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `BCAT-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildBlogCategoryQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { categoryName: str }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= BLOG HELPERS ================= */
export const generateBlogId = async () => {
  const blogs = await Blog.find({ id: /^BLOG-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const b of blogs) {
    const match = b.id?.match(/^BLOG-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `BLOG-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildBlogQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { blogName: str }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= LEAD HELPERS ================= */
export const generateLeadId = async () => {
  const leads = await Lead.find({ id: /^LED-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const l of leads) {
    const match = l.id?.match(/^LED-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `LED-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildLeadQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { mobile: str }, { email: str.toLowerCase() }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= CMS HELPERS ================= */
export const generateCmsId = async () => {
  const cmsList = await CMS.find({ id: /^CMS-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const c of cmsList) {
    const match = c.id?.match(/^CMS-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `CMS-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildCmsQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [{ id: str }, { sectionName: new RegExp(`^${str}$`, "i") }],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= SEO HELPERS ================= */
export const generateSeoId = async () => {
  const seoList = await SEO.find({ id: /^SEO-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const s of seoList) {
    const match = s.id?.match(/^SEO-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `SEO-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildSeoQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { name: new RegExp(`^${str}$`, "i") },
          { page: new RegExp(`^${str}$`, "i") },
          { path: str },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};
