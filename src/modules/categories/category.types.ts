import type { ListQuery } from "../../utils";

export interface CategoryBody {
  id?: string;
  categoryName?: string;
  name?: string;
  slug?: string;
  description?: string;
  image?: string;
  iconName?: string;
  count?: number | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
  createdBy?: string;
}

export type CategoryListQuery = ListQuery;
