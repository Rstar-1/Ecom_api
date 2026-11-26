import mongoose from "mongoose";
import { roles } from "../../constants";
import { Role, type RoleDocument } from "./role.model";
import { User, type UserDocument } from "../users/user.model";
import { isObjectId, str } from "../../utils";

/** Roles anyone may pick when signing up without being logged in as an admin (all supported). */
export const PUBLIC_SIGNUP_ROLES: readonly string[] = [
  roles.ADMIN,
  roles.MANAGER,
  roles.ACCOUNTANT,
  "product",
  roles.VENDOR,
  roles.CUSTOMER,
  roles.DEV_ADMIN,
];

export interface RoleSelector {
  roleId?: string;
  rolename?: string;
  role?: string;
}

/**
 * Finds the role a user should get (by roleId, then by name), falling back to "customer".
 * Allows all roles without restrictions.
 */
export const resolveRole = async (
  { roleId, rolename, role }: RoleSelector,
  _allowedNames?: readonly string[]
): Promise<RoleDocument> => {
  let roleDoc: RoleDocument | null = null;

  if (roleId && isObjectId(roleId)) {
    roleDoc = await Role.findOne({ _id: roleId, isDeleted: false });
  }
  if (!roleDoc) {
    const name = str(rolename || role).toLowerCase();
    if (name) {
      roleDoc = await Role.findOne({
        $or: [{ rolename: name }, { name }],
        isDeleted: false,
      });
    }
  }
  if (!roleDoc) {
    roleDoc = await Role.findOne({ rolename: roles.CUSTOMER, isDeleted: false });
  }
  if (!roleDoc) {
    // Auto-create default role if missing so registration never fails
    roleDoc = await Role.create({
      rolename: str(rolename || role).toLowerCase() || roles.CUSTOMER,
      name: str(rolename || role).toLowerCase() || roles.CUSTOMER,
      permissions: ["Full_Access", "*", "dashboard", "view_dashboard"],
      pages: ["Full_Access", "Dashboard"],
      isActive: true,
      isDeleted: false,
    });
  }
  return roleDoc;
};

export interface RoleSummary {
  role: string;
  rolename: string;
  permissions: string[];
  pages: string[];
}

export const roleSummary = (roleDoc: RoleDocument | null): RoleSummary => {
  const name = roleDoc?.rolename ?? roles.CUSTOMER;
  return {
    role: name.toLowerCase(),
    rolename: name,
    permissions: roleDoc?.permissions ?? [],
    pages: roleDoc?.pages ?? [],
  };
};

/** User JSON (no password) plus flattened role info, as the dashboard expects. */
export const userWithRole = (user: UserDocument, roleDoc: RoleDocument | null) => ({
  ...(user.toJSON() as Record<string, unknown>),
  ...roleSummary(roleDoc),
});

export const ROLE_POPULATE = "id rolename permissions pages";
export const CREATOR_POPULATE = "id fullname email mobile image role";

export const resolveUserObjectId = async (identifier: unknown): Promise<string | undefined> => {
  if (!identifier) return undefined;
  const strId = String(identifier).trim();
  if (/^[a-f\d]{24}$/i.test(strId)) return strId;
  try {
    const u = await User.findOne({
      $or: [{ id: strId }, { email: strId.toLowerCase() }, { mobile: strId }] as any,
    }).select("_id").lean();
    return u?._id ? (u._id as any).toString() : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Role-based Creator filter:
 * - If user is Admin, Dev Admin, or has Full_Access, no filter is applied (sees all data across all roles).
 * - If user has any other custom role, only sees their own added data + admin-added data.
 */
export const getRoleBasedCreatorFilter = async (identifier?: unknown): Promise<Record<string, unknown>> => {
  if (!identifier) return {};
  const strId = String(identifier).trim();
  if (!strId) return {};

  try {
    const isHex = /^[a-f\d]{24}$/i.test(strId);
    const targetUser = await User.findOne({
      $or: [
        ...(isHex ? [{ _id: new mongoose.Types.ObjectId(strId) }] : []),
        { id: strId },
        { email: strId.toLowerCase() },
        { mobile: strId },
      ],
    })
      .select("_id id role roleId")
      .populate("roleId", "rolename permissions pages")
      .lean();

    if (!targetUser) return {};

    const roleName = String(
      (targetUser as any).roleId?.rolename || (targetUser as any).role || ""
    )
      .toLowerCase()
      .trim();

    const permissions: string[] = Array.isArray((targetUser as any).roleId?.permissions)
      ? (targetUser as any).roleId.permissions
      : [];
    const isFullAccess =
      permissions.includes("Full_Access") ||
      permissions.includes("*") ||
      roleName === "admin" ||
      roleName.includes("admin") ||
      roleName === "dev admin" ||
      roleName === "dev_admin" ||
      roleName === "devadmin" ||
      roleName === "super admin" ||
      roleName === "super_admin";

    // Admin, Dev Admin, and Full_Access roles see all data across all roles
    if (isFullAccess) {
      return {};
    }

    // Find all Admin / Dev Admin / Full_Access roles in the system
    const adminRoles = await Role.find({
      $or: [
        { rolename: { $in: ["admin", "dev admin", "dev_admin", "devadmin", "super admin", "super_admin"] } },
        { permissions: { $in: ["Full_Access", "*"] } },
      ],
      isDeleted: false,
    }).select("_id");
    const adminRoleIds = adminRoles.map((r) => r._id);

    // Find all Admin / Dev Admin users in the system
    const adminUsers = await User.find({
      $or: [
        { role: { $in: ["admin", "dev admin", "dev_admin", "devadmin", "super admin", "super_admin"] } },
        { roleId: { $in: adminRoleIds } },
      ],
      isDeleted: false,
    })
      .select("_id")
      .lean();

    const rawIds = [targetUser._id, ...adminUsers.map((u) => u._id)].filter(Boolean);
    const allowedObjectIds: mongoose.Types.ObjectId[] = [];
    const seen = new Set<string>();

    for (const raw of rawIds) {
      const s = String(raw);
      if (/^[a-f\d]{24}$/i.test(s) && !seen.has(s)) {
        seen.add(s);
        allowedObjectIds.push(new mongoose.Types.ObjectId(s));
      }
    }

    if (!allowedObjectIds.length) {
      return {
        $or: [
          { createdBy: null },
          { createdBy: { $exists: false } },
        ],
      };
    }

    return {
      $or: [
        { createdBy: { $in: allowedObjectIds } },
        { createdBy: null },
        { createdBy: { $exists: false } },
      ],
    };
  } catch {
    return {};
  }
};
