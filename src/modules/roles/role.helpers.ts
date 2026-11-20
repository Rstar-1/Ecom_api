import { roles } from "../../constants";
import { Role, type RoleDocument, type UserDocument } from "../../models";
import { AppError, isObjectId, str } from "../../utils";

/** Roles anyone may pick when signing up without being logged in as an admin. */
export const PUBLIC_SIGNUP_ROLES: readonly string[] = [roles.CUSTOMER, roles.VENDOR];

export interface RoleSelector {
  roleId?: string;
  rolename?: string;
  role?: string;
}

/**
 * Finds the role a user should get (by roleId, then by name), falling back to "customer".
 * When `allowedNames` is given, only those role names may be chosen.
 */
export const resolveRole = async (
  { roleId, rolename, role }: RoleSelector,
  allowedNames?: readonly string[]
): Promise<RoleDocument> => {
  let roleDoc: RoleDocument | null = null;

  if (roleId && isObjectId(roleId)) {
    roleDoc = await Role.findOne({ _id: roleId, isDeleted: false });
  }
  if (!roleDoc) {
    const name = str(rolename || role).toLowerCase();
    if (name) roleDoc = await Role.findOne({ rolename: name, isDeleted: false });
  }
  if (roleDoc && allowedNames && !allowedNames.includes(roleDoc.rolename)) {
    throw AppError.forbidden(`Role "${roleDoc.rolename}" cannot be chosen at sign-up`);
  }
  if (!roleDoc) {
    roleDoc = await Role.findOne({ rolename: roles.CUSTOMER, isDeleted: false });
  }
  if (!roleDoc) {
    throw AppError.internal(`Default "${roles.CUSTOMER}" role is not configured. Create it in /api/roles first.`);
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
export const CREATOR_POPULATE = "id fullname email mobile image";
