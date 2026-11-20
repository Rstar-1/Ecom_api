import type { ListQuery } from "../../utils";

export interface RoleBody {
  id?: string;
  /** Any of these is accepted as the role name */
  rolename?: string;
  roleName?: string;
  name?: string;
  role?: string;
  /** Array, JSON array string or comma separated string */
  permissions?: string[] | string;
  pages?: string[] | string;
  count?: number | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
}

export type RoleListQuery = ListQuery;
