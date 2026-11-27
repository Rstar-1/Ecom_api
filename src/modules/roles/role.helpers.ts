import mongoose from "mongoose";
import { roles } from "../../constants";
import { Role, type RoleDocument } from "./role.model";
import { User, type UserDocument } from "../users/user.model";
import { isObjectId, str, type Filter } from "../../utils";

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
  let strId = "";
  if (typeof identifier === "object" && identifier !== null) {
    strId = String(
      (identifier as any)._id ||
      (identifier as any).value ||
      (identifier as any).id ||
      (identifier as any).userId ||
      ""
    ).trim();
  } else {
    strId = String(identifier).trim();
  }
  if (!strId || strId === "[object Object]") return undefined;
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
 * Resolves creator-or-admin filter for role-based scoping:
 * If the user is NOT an admin, they can ONLY see:
 * 1) Items they created (createdBy: userId)
 * 2) Items created by any Admin user (createdBy: { $in: adminUserIds })
 * 3) Default / system-seeded items (createdBy: null or doesn't exist)
 * If the user IS an admin (or no userId provided), returns null (no restriction).
 */
export const getCreatorOrAdminFilter = async (
  userIdOrIdentifier?: unknown
): Promise<Filter | null> => {
  if (!userIdOrIdentifier) return null;
  const userObjectId = await resolveUserObjectId(userIdOrIdentifier);
  if (!userObjectId) return null;

  // Check if requesting user is Admin
  const requestingUser = await User.findById(userObjectId).populate("roleId").lean();
  if (requestingUser) {
    const roleName = String(
      (requestingUser.roleId as any)?.rolename ||
      (requestingUser.roleId as any)?.name ||
      requestingUser.role ||
      ""
    ).toLowerCase().trim();
    const permissions = (requestingUser.roleId as any)?.permissions || [];
    if (
      roleName === "admin" ||
      roleName === "dev_admin" ||
      roleName === "devadmin" ||
      roleName === "dev admin" ||
      roleName.includes("admin") ||
      (Array.isArray(permissions) && (permissions.includes("Full_Access") || permissions.includes("*")))
    ) {
      return null; // Admin sees all data
    }
  }

  // Find all Admin role IDs
  const adminRoles = await Role.find({
    $or: [
      { rolename: { $in: ["admin", "dev_admin", "devadmin", "dev admin", "administrator"] } },
      { name: { $in: ["admin", "dev_admin", "devadmin", "dev admin", "administrator"] } },
      { permissions: { $in: ["Full_Access", "*"] } },
    ],
  }).select("_id").lean();
  const adminRoleIds = adminRoles.map((r) => r._id);

  // Find all Admin user ObjectIds
  const adminUsers = await User.find({
    $or: [
      { role: { $in: ["admin", "dev_admin", "devadmin", "dev admin", "administrator"] } },
      { roleId: { $in: adminRoleIds } },
    ],
  }).select("_id").lean();

  const userObjId = new mongoose.Types.ObjectId(userObjectId);
  const adminObjectIds: mongoose.Types.ObjectId[] = adminUsers
    .map((u: any) => u._id)
    .filter((id: any) => mongoose.Types.ObjectId.isValid(String(id)))
    .map((id: any) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id))));

  return {
    $or: [
      // 1. Explicitly assigned to this vendor:
      { vendorBy: userObjId },
      // 2. Created by this vendor:
      { createdBy: userObjId },
      // 3. Created by admin or system unassigned to any specific vendor:
      {
        createdBy: { $in: [...adminObjectIds, null] },
        vendorBy: { $in: [null, undefined] },
      },
      // 4. Default unassigned items where createdBy does not exist:
      {
        createdBy: { $exists: false },
        vendorBy: { $in: [null, undefined] },
      },
    ],
  };
};
