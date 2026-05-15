import express from "express";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "./role.controller.js";

const router = express.Router();

// CREATE
router.post("/", createRole);

// READ ALL
router.get("/", getRoles);

// READ ONE
router.get("/:id", getRoleById);

// UPDATE
router.put("/:id", updateRole);

// DELETE
router.delete("/:id", deleteRole);

export default router;
