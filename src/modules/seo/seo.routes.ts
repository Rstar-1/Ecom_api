import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, upload } from "../../middlewares";
import {
  bulkDeleteSeo,
  createSeo,
  deleteSeo,
  getSeoById,
  getSeoByPage,
  getSeoByPath,
  getSeoList,
  seedSeo,
  updateSeo,
  uploadImage,
} from "./seo.controller";

const router = Router();
const canManage = [authMiddleware, checkPermission(PERMISSIONS.SEO_MANAGE)];

/* Public reads (the website loads meta tags from these) */
router.get("/", getSeoList);
router.get("/by-path", getSeoByPath);
router.get("/page/:page", getSeoByPage);

/* Dashboard */
router.post("/upload", ...canManage, upload.single("image"), uploadImage);
router.post("/seed", ...canManage, seedSeo);
router.post("/bulk-delete", ...canManage, bulkDeleteSeo);
router.delete("/bulk-delete", ...canManage, bulkDeleteSeo);
router.post("/", ...canManage, upload.single("image"), createSeo);

router.get("/:id", getSeoById);
router.put("/:id", ...canManage, upload.single("image"), updateSeo);
router.delete("/:id", ...canManage, deleteSeo);

export default router;
