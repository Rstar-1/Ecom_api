import mongoose from "mongoose";
import { Role, User } from "../models/index.js";

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
    const match = r.id.match(/^ROLE-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `ROLE-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildRoleQuery = (identifier) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  return {
    $or: isObjectId
      ? [{ _id: identifier }, { id: identifier }]
      : [{ id: identifier }, { rolename: identifier.trim().toLowerCase() }],
    isDeleted: false,
  };
};

/* ================= USER HELPERS ================= */
export const generateUserId = async () => {
  const users = await User.find({ id: /^USER-\d+$/ }).select("id").lean();

  let maxNum = 0;
  for (const u of users) {
    const match = u.id.match(/^USER-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  const nextNum = maxNum + 1;
  const padLength = Math.max(3, String(nextNum).length);
  return `USER-${String(nextNum).padStart(padLength, "0")}`;
};

export const buildUserQuery = (identifier) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  return {
    $or: isObjectId
      ? [{ _id: identifier }, { id: identifier }]
      : [
          { id: identifier },
          { email: identifier.trim().toLowerCase() },
          { mobile: identifier.trim() },
        ],
    isDeleted: false,
  };
};
