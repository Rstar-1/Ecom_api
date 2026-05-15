import { Role } from "../models/index.js";

/* ================= ADDRESS ================= */
export const parseAddress = (address) => {
  if (!address) return [];

  if (typeof address === "string") {
    try {
      const parsed = JSON.parse(address);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return Array.isArray(address) ? address : [];
};

/* ================= ROLE ================= */
export const validateRole = async (role) => {
  if (!role) return "user";

  const exists = await Role.findOne({
    name: role,
    isDeleted: false,
    isActive: true,
  });

  if (!exists) {
    throw new Error("Invalid role");
  }

  return role;
};

/* ================= VENDOR VALIDATION ================= */
export const validateVendorData = (role, data) => {
  if (role !== "vendor") return;

  if (!data.shopDetails) {
    throw new Error("Shop details required for vendor");
  }

  const { shopName, gstNumber, panNumber } = data.shopDetails;

  if (!shopName || !gstNumber || !panNumber) {
    throw new Error("Incomplete shop details");
  }
};

/* ================= MERGE ================= */
export const mergeObjects = (oldObj, newObj) => {
  return {
    ...(oldObj || {}),
    ...(newObj || {}),
  };
};