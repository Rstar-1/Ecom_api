import { Router } from "express";
import { authMiddleware, checkPermission, upload } from "../../middlewares";
import { getProfile, getUsers, updateUser, uploadDocuments } from "./user.controller";

const router = Router();

router.use(authMiddleware);

router.get("/profile", getProfile);
router.get("/", checkPermission("USER_VIEW"), getUsers);
router.put("/:id", checkPermission("USER_UPDATE"), updateUser);

router.post(
  "/upload-documents",
  checkPermission("USER_UPDATE"),
  upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  uploadDocuments
);

export default router;
