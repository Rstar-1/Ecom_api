import type { ListQuery } from "../../utils";

export interface BlogCategoryBody {
  id?: string;
  categoryName?: string;
  name?: string;
  count?: number | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
  createdBy?: string;
}

export type BlogCategoryListQuery = ListQuery;
