import type { ParamsDictionary } from "express-serve-static-core";

export interface CartVariant {
  size?: string;
  color?: string;
}

export interface AddToCartBody {
  productId?: string;
  vendorId?: string;
  name?: string;
  image?: string;
  price?: number;
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
