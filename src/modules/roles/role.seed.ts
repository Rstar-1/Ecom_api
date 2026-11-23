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

const ALL_PERMISSIONS = [
  "Full_Access",
  "*",
  "dashboard",
  "view_dashboard",
  "view_analytics",
  "view_orders",
  "add_orders",
  "edit_orders",
  "trash_orders",
  "view_transactions",
  "add_transactions",
  "edit_transactions",
  "trash_transactions",
  "view_systemuser",
  "view_products",
  "add_products",
  "edit_products",
  "trash_products",
  "view_categories",
  "add_categories",
  "edit_categories",
  "trash_categories",
  "view_customers",
  "add_customers",
  "edit_customers",
  "trash_customers",
  "view_leads",
  "add_leads",
  "edit_leads",
  "trash_leads",
  "view_blogs",
  "add_blogs",
  "edit_blogs",
  "trash_blogs",
  "view_cms",
  "add_cms",
  "edit_cms",
  "trash_cms",
  "view_seo",
  "add_seo",
  "edit_seo",
  "trash_seo",
  "manage_users",
  "manage_roles",
  "view_campaign",
  "manage_campaign",
  "send_campaign",
  "manage_products",
  "manage_categories",
  "manage_product_categories",
  "view_product_categories",
  "manage_blogs",
  "manage_blog_categories",
  "view_blog_categories",
];

const ALL_PAGES = [
  "Full_Access",
  "Dashboard",
  "Analytics",
  "Orders",
  "Transactions",
  "System Users",
  "Products",
  "Products Category",
  "Customers",
  "Leads",
  "Blogs",
  "Blogs Category",
  "CMS",
  "SEO",
  "Roles",
  "Campaigns",
];

export const DEFAULT_ROLES: readonly RoleSeedItem[] = [
  {
    id: "ROLE-001",
    rolename: "admin",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
  {
    id: "ROLE-002",
    rolename: "manager",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
  {
    id: "ROLE-003",
    rolename: "accountant",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
  {
    id: "ROLE-004",
    rolename: "product",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
  {
    id: "ROLE-005",
    rolename: "vendor",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
  {
    id: "ROLE-006",
    rolename: "customer",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
  {
    id: "ROLE-007",
    rolename: "dev admin",
    permissions: ALL_PERMISSIONS,
    pages: ALL_PAGES,
    isActive: true,
  },
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
      // Merge new default permissions into existing role if missing
      const existingPerms = new Set((existing.permissions || []).map((p) => String(p).toLowerCase()));
      const toAdd = item.permissions.filter((p) => !existingPerms.has(p.toLowerCase()));
      if (toAdd.length > 0) {
        existing.permissions = [...(existing.permissions || []), ...toAdd];
        await existing.save();
        logger.info(`ROLE_UPDATED_PERMISSIONS: ${item.rolename} (+${toAdd.length} permissions)`);
      }
    }
  }
};
