import User from "./User.model.js";
import Role from "./Role.model.js";
import Otp from "./Otp.model.js";
import ProductCategory from "./ProductCategory.model.js";
import Product from "./Product.model.js";
import BlogCategory from "./BlogCategory.model.js";
import Blog from "./Blog.model.js";
import Lead from "./Lead.model.js";
import CMS from "./CMS.model.js";
import SEO from "./SEO.model.js";

// Alias Category to ProductCategory for backward compatibility
const Category = ProductCategory;

export { User, Role, Otp, ProductCategory, Product, Category, BlogCategory, Blog, Lead, CMS, SEO };
export default { User, Role, Otp, ProductCategory, Product, Category, BlogCategory, Blog, Lead, CMS, SEO };
