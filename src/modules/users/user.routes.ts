import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, upload } from "../../middlewares";
import {
  bulkDeleteUsers,
  deleteUser,
  getProfile,
  getUserById,
  getUsers,
  updateProfile,
  updateUser,
  uploadDocuments,
} from "./user.controller";

const router = Router();

router.use(authMiddleware);

/* ================= PROFILE ================= */
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post(
  "/upload-documents",
  upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  uploadDocuments
);

/* ================= USERS CRUD ================= */
router.get("/", checkPermission(PERMISSIONS.USER_VIEW), getUsers);
router.post("/bulk-delete", checkPermission(PERMISSIONS.USER_DELETE), bulkDeleteUsers);
router.delete("/bulk-delete", checkPermission(PERMISSIONS.USER_DELETE), bulkDeleteUsers);
router.get("/:id", checkPermission(PERMISSIONS.USER_VIEW), getUserById);
router.put("/:id", checkPermission(PERMISSIONS.USER_UPDATE), updateUser);
router.delete("/:id", checkPermission(PERMISSIONS.USER_DELETE), deleteUser);

export default router;
