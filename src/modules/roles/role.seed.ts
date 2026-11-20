import { Role } from "../../models";
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
    permissions: [
      "Full_Access",
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
    ],
    pages: [
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
    ],
    isActive: true,
  },
  {
    id: "ROLE-002",
    rolename: "manager",
    permissions: [
      "dashboard",
      "view_dashboard",
      "view_analytics",
      "view_orders",
      "add_orders",
      "edit_orders",
      "view_products",
      "add_products",
      "edit_products",
      "view_customers",
      "view_leads",
      "view_blogs",
    ],
    pages: ["Dashboard", "Analytics", "Orders", "Products", "Customers", "Leads", "Blogs"],
    isActive: true,
  },
  {
    id: "ROLE-003",
    rolename: "accountant",
    permissions: [
      "dashboard",
      "view_dashboard",
      "view_analytics",
      "view_orders",
      "view_transactions",
      "add_transactions",
      "edit_transactions",
    ],
    pages: ["Dashboard", "Analytics", "Orders", "Transactions"],
    isActive: true,
  },
  {
    id: "ROLE-004",
    rolename: "product",
    permissions: [
      "dashboard",
      "view_dashboard",
      "view_products",
      "add_products",
      "edit_products",
      "trash_products",
    ],
    pages: ["Dashboard", "Products", "Products Category"],
    isActive: true,
  },
  {
    id: "ROLE-005",
    rolename: "vendor",
    permissions: [
      "dashboard",
      "view_dashboard",
      "view_orders",
      "view_products",
      "add_products",
      "edit_products",
    ],
    pages: ["Dashboard", "Orders", "Products"],
    isActive: true,
  },
  {
    id: "ROLE-006",
    rolename: "customer",
    permissions: ["dashboard", "view_dashboard"],
    pages: ["Dashboard"],
    isActive: true,
  },
];

/** Ensures all default roles exist in the database. Safe to run repeatedly. */
export const seedInitialRoles = async (): Promise<void> => {
  try {
    const coll = Role.collection;
    const indexes = await coll.indexes();
    if (indexes.some((idx) => idx.name === "name_1")) {
      await coll.dropIndex("name_1").catch(() => {});
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
    }
  }
};
