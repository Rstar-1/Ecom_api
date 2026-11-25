import { ProductCategory } from "../categories/category.model";
import { Role } from "./role.model";
import { logger } from "../../utils";

export interface RoleSeedItem {
  id: string;
  rolename: string;
  permissions: string[];
  pages: string[];
  isActive: boolean;
}

export const DEFAULT_ROLES: readonly RoleSeedItem[] = [
  {
    id: "ROLE-001",
    rolename: "admin",
    permissions: ["Full_Access"],
    pages: ["Full_Access"],
    isActive: true,
  }
];

/** Ensures all default roles exist in the database and have full permissions. Safe to run repeatedly. */
export const seedInitialRoles = async (): Promise<void> => {
  try {
    const coll = Role.collection;
    const indexes = await coll.indexes();
    if (indexes.some((idx) => idx.name === "name_1")) {
      await coll.dropIndex("name_1").catch(() => {});
    }

    const catColl = ProductCategory.collection;
    const catIndexes = await catColl.indexes().catch(() => []);
    if (catIndexes.some((idx) => idx.name === "slug_1")) {
      await catColl.dropIndex("slug_1").catch(() => {});
    }
    if (catIndexes.some((idx) => idx.name === "categoryName_1")) {
      await catColl.dropIndex("categoryName_1").catch(() => {});
    }
  } catch {
    /* ignore index drop errors */
  }

  for (const item of DEFAULT_ROLES) {
    const existing = await Role.findOne({
      $or: [{ rolename: item.rolename }, { name: item.rolename }],
    });
    if (!existing) {
      await Role.create({
        id: item.id,
        rolename: item.rolename,
        name: item.rolename,
        permissions: item.permissions,
        pages: item.pages,
        isActive: item.isActive,
        isDeleted: false,
      });
      logger.info(`ROLE_SEEDED: ${item.rolename} (${item.id})`);
    } else {
      // Sync default role permissions and pages with current ROLE_ACCESS_CONFIG
      existing.permissions = [...item.permissions];
      existing.pages = [...item.pages];
      await existing.save();
      logger.info(`ROLE_UPDATED_PERMISSIONS: ${item.rolename} (${item.permissions.length} perms, ${item.pages.length} pages)`);
    }
  }
};
