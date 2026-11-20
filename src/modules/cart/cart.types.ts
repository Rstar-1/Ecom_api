import type { ParamsDictionary } from "express-serve-static-core";

export interface CartVariant {
  size?: string;
  color?: string;
}

export interface AddToCartBody {
  /** Mongo _id or PROD-001; name/price/image are read from the product */
  productId?: string;
  quantity?: number;
  variant?: CartVariant;
}

export interface UpdateCartBody {
  productId?: string;
  quantity?: number;
  variant?: CartVariant;
}

export interface RemoveFromCartParams extends ParamsDictionary {
  productId: string;
}

export interface RemoveFromCartBody {
  variant?: CartVariant;
}
