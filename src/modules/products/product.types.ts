import type { ReviewInput, SpecificationInput } from "./product.model";
import type { ListQuery } from "../../utils";

export interface ProductBody {
  id?: string;
  productName?: string;
  description?: string;
  shortDesc?: string;
  price?: number | string;
  unit?: string;
  currency?: string;
  totalStock?: number | string;
  reservedStock?: number | string;
  stockStatus?: boolean | string;
  isTrending?: boolean | string;
  severity?: string;
  /** Mongo _id, PCAT-001 or category name */
  categoryId?: string;
  image?: string;
  /** Arrays may also be sent as JSON strings or comma separated strings (multipart) */
  images?: string[] | string;
  badges?: string[] | string;
  specifications?: SpecificationInput[] | string;
  reviews?: ReviewInput[] | string;
  isActive?: boolean | string;
  isDeleted?: boolean | string;
}

export interface ProductListQuery extends ListQuery {
  categoryId?: string;
  severity?: string;
  isTrending?: string;
  stockStatus?: string;
}

export interface ReviewParams {
  id: string;
  reviewId: string;
  [key: string]: string;
}

export type ProductFiles = Partial<Record<"image" | "images", Express.Multer.File[]>>;
