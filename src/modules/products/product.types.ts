export const PRODUCT_STATUSES = ["pending", "approved", "rejected"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface ProductVariant {
  size?: string;
  color?: string;
  price?: number;
  stock?: number;
  sku?: string;
}

export interface ProductBody {
  name?: string;
  description?: string;
  categoryId?: string;
  images?: string[];
  basePrice?: number;
  attributes?: Record<string, unknown>;
  variants?: ProductVariant[];
  totalStock?: number;
  status?: ProductStatus;
  isActive?: boolean;
}

export interface ProductListQuery {
  categoryId?: string;
  vendorId?: string;
  search?: string;
  status?: string;
}
