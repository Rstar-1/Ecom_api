import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, upload } from "../../middlewares";
import blogCategoryRoutes from "../blog-categories/blogCategory.routes";
import {
  addReview,
  bulkDeleteBlogs,
  createBlog,
  deleteBlog,
  deleteReview,
  getBlogById,
  getBlogs,
  updateBlog,
} from "./blog.controller";

const router = Router();

/* /api/blogs/categories is an alias of /api/blog-categories (must be before /:id) */
router.use("/categories", blogCategoryRoutes);

router.get("/", getBlogs);
router.post("/", authMiddleware, checkPermission(PERMISSIONS.BLOG_CREATE), upload.single("image"), createBlog);

router.post("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.BLOG_DELETE), bulkDeleteBlogs);
router.delete("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.BLOG_DELETE), bulkDeleteBlogs);

/* Reviews: any logged-in user can review; removing needs blog update rights */
router.post("/:id/reviews", authMiddleware, addReview);
router.delete("/:id/reviews/:reviewId", authMiddleware, checkPermission(PERMISSIONS.BLOG_UPDATE), deleteReview);

router.get("/:id", getBlogById);
router.put("/:id", authMiddleware, checkPermission(PERMISSIONS.BLOG_UPDATE), upload.single("image"), updateBlog);
router.delete("/:id", authMiddleware, checkPermission(PERMISSIONS.BLOG_DELETE), deleteBlog);

export default router;
