import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, handleFormData } from "../../middlewares";
import {
  bulkDeleteRoles,
  createRole,
  deleteRole,
  getRoleById,
  getRoles,
  updateRole,
} from "./role.controller";

const router = Router();

/* Public reads (sign-up forms need the role list) */
router.get("/", getRoles);

/* Writes need login + permission (admin/manager always allowed) */
router.post("/", authMiddleware, checkPermission(PERMISSIONS.ROLE_CREATE), handleFormData, createRole);
router.post("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.ROLE_DELETE), bulkDeleteRoles);
router.delete("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.ROLE_DELETE), bulkDeleteRoles);

router.get("/:id", getRoleById);
router.put("/:id", authMiddleware, checkPermission(PERMISSIONS.ROLE_UPDATE), handleFormData, updateRole);
router.delete("/:id", authMiddleware, checkPermission(PERMISSIONS.ROLE_DELETE), deleteRole);

export default router;
