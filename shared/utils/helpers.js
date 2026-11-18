import mongoose from "mongoose";
import {
  Role,
  User,
  Lead,
  Campaign,
  Product,
  ProductCategory,
  Category,
  Blog,
  BlogCategory,
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

/* ================= LEAD HELPERS ================= */
export const generateLeadId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const LeadModel = Lead || mongoose.models.Lead || mongoose.model("Lead");
      const leads = await LeadModel.find({ id: /^LED-\d+$/ }).select("id").lean().maxTimeMS(5000);

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
    }
  } catch {}
  return `LED-${Date.now().toString().slice(-4)}`;
};

export const buildLeadQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { mobile: str },
          { email: str.toLowerCase() },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= CAMPAIGN HELPERS ================= */
export const generateCampaignId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const CampaignModel =
        Campaign || mongoose.models.Campaign || mongoose.model("Campaign");
      const campaigns = await CampaignModel.find({ id: /^CMP-\d+$/ })
        .select("id")
        .lean()
        .maxTimeMS(5000);

      let maxNum = 0;
      for (const c of campaigns) {
        const match = c.id?.match(/^CMP-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }

      const nextNum = maxNum + 1;
      const padLength = Math.max(3, String(nextNum).length);
      return `CMP-${String(nextNum).padStart(padLength, "0")}`;
    }
  } catch {}
  return `CMP-${Date.now().toString().slice(-4)}`;
};

export const buildCampaignQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { name: { $regex: `^${str}$`, $options: "i" } },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= PRODUCT HELPERS ================= */
export const generateProductId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const ProductModel = Product || mongoose.models.Product || mongoose.model("Product");
      const products = await ProductModel.find({ id: /^PROD-\d+$/ }).select("id").lean().maxTimeMS(5000);

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
    }
  } catch {}
  return `PROD-${Date.now().toString().slice(-4)}`;
};

export const buildProductQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { productName: { $regex: `^${str}$`, $options: "i" } },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= PRODUCT CATEGORY HELPERS ================= */
export const generateProductCategoryId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const CategoryModel = ProductCategory || Category || mongoose.models.ProductCategory || mongoose.model("ProductCategory");
      const categories = await CategoryModel.find({ id: /^PCAT-\d+$/ }).select("id").lean().maxTimeMS(5000);

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
    }
  } catch {}
  return `PCAT-${Date.now().toString().slice(-4)}`;
};

export const generateCategoryId = generateProductCategoryId;

export const buildProductCategoryQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { categoryName: { $regex: `^${str}$`, $options: "i" } },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

export const buildCategoryQuery = buildProductCategoryQuery;

/* ================= BLOG HELPERS ================= */
export const generateBlogId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const BlogModel = Blog || mongoose.models.Blog || mongoose.model("Blog");
      const blogs = await BlogModel.find({ id: /^BLOG-\d+$/ }).select("id").lean().maxTimeMS(5000);

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
    }
  } catch {}
  return `BLOG-${Date.now().toString().slice(-4)}`;
};

export const buildBlogQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { blogName: { $regex: `^${str}$`, $options: "i" } },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= BLOG CATEGORY HELPERS ================= */
export const generateBlogCategoryId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const BlogCatModel = BlogCategory || mongoose.models.BlogCategory || mongoose.model("BlogCategory");
      const categories = await BlogCatModel.find({ id: /^BCAT-\d+$/ }).select("id").lean().maxTimeMS(5000);

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
    }
  } catch {}
  return `BCAT-${Date.now().toString().slice(-4)}`;
};

export const buildBlogCategoryQuery = (identifier, includeDeleted = true) => {
  if (!identifier) return { _id: null };
  const str = String(identifier).trim();
  const isObjectId = mongoose.Types.ObjectId.isValid(str);
  const query = {
    $or: isObjectId
      ? [{ _id: new mongoose.Types.ObjectId(str) }, { id: str }]
      : [
          { id: str },
          { categoryName: { $regex: `^${str}$`, $options: "i" } },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};

/* ================= SEO HELPERS ================= */
export const generateSeoId = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const SeoModel = SEO || mongoose.models.SEO || mongoose.model("SEO");
      const seoList = await SeoModel.find({ id: /^SEO-\d+$/ }).select("id").lean().maxTimeMS(5000);

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
    }
  } catch {}
  return `SEO-${Date.now().toString().slice(-4)}`;
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
          { name: { $regex: `^${str}$`, $options: "i" } },
          { path: str },
          { page: { $regex: `^${str}$`, $options: "i" } },
        ],
  };
  if (!includeDeleted) {
    query.isDeleted = false;
  }
  return query;
};
