import type { ReviewInput, SpecificationInput } from "../products/product.model";
import type { ListQuery } from "../../utils";

export interface BlogBody {
  id?: string;
  /** Mongo _id, BCAT-001 or category name */
  categoryId?: string;
  blogName?: string;
  description?: string;
  shortDesc?: string;
  quote?: string;
  image?: string;
  readTime?: string;
  badges?: string[] | string;
  specifications?: SpecificationInput[] | string;
  reviews?: ReviewInput[] | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
}

export interface BlogListQuery extends ListQuery {
  categoryId?: string;
}
