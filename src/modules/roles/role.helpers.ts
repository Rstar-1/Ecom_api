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
