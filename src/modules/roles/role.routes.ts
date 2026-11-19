import { Router } from "express";
import { roles } from "../../constants";
import { authMiddleware, checkPermission } from "../../middlewares";
import { createRole, deleteRole, getRoleById, getRoles, updateRole } from "./role.controller";

const router = Router();

/* Admin only */
router.use(authMiddleware, checkPermission(roles.ADMIN));

router.post("/", createRole);
router.get("/", getRoles);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);
router.delete("/:id", deleteRole);

export default router;
