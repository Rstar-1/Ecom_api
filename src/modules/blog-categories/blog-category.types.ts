import type { ListQuery } from "../../utils";

export interface BlogCategoryBody {
  id?: string;
  categoryName?: string;
  name?: string;
  count?: number | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
  createdBy?: string;
  vendorBy?: string | unknown;
  VendorBy?: string | unknown;
}

export type BlogCategoryListQuery = ListQuery;
