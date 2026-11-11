import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
  bulkDeleteRole,
} from "./role.controller.js";
import { middleware } from "../../../../../shared/index.js";

const { upload, uploadErrorHandler } = middleware;
const router = express.Router();

// CREATE (handles both JSON and FormData)
router.post("/", upload.none(), uploadErrorHandler, createRole);

// READ ALL (supports pagination with ?page=1&limit=10)
router.get("/", getRoles);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteRole);
router.delete("/bulk-delete", bulkDeleteRole);

// READ ONE
router.get("/:id", getRoleById);

// UPDATE (handles both JSON and FormData)
router.put("/:id", upload.none(), uploadErrorHandler, updateRole);

// DELETE ONE
router.delete("/:id", deleteRole);

export default router;
