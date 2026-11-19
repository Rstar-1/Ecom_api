import type { ApiHandler, EmptyParams } from "../../types/http";
import { getAuthUser, successResponse } from "../../utils";
import type { AddToCartBody, RemoveFromCartBody, RemoveFromCartParams, UpdateCartBody } from "./cart.types";
import * as cartService from "./cart.service";

/* GET /api/cart */
export const getCart: ApiHandler = async (req, res, next) => {
  try {
    const cart = await cartService.getCartByUserId(getAuthUser(req).id);
    successResponse(res, cart, "Cart fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/cart/add */
export const addToCart: ApiHandler<EmptyParams, AddToCartBody> = async (req, res, next) => {
  try {
    const cart = await cartService.addItemToCart(getAuthUser(req).id, req.body ?? {});
    successResponse(res, cart, "Item added to cart");
  } catch (error) {
    next(error);
  }
};

/* PUT /api/cart/update */
export const updateCart: ApiHandler<EmptyParams, UpdateCartBody> = async (req, res, next) => {
  try {
    const { productId, quantity, variant } = req.body ?? {};
    const cart = await cartService.updateItemQuantity(getAuthUser(req).id, productId, quantity, variant);
    successResponse(res, cart, "Cart updated successfully");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/cart/remove/:productId */
export const removeFromCart: ApiHandler<RemoveFromCartParams, RemoveFromCartBody> = async (req, res, next) => {
  try {
    // variant distinguishes items of the same product
    const cart = await cartService.removeItemFromCart(getAuthUser(req).id, req.params.productId, req.body?.variant);
    successResponse(res, cart, "Item removed from cart");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/cart/clear */
export const clearCart: ApiHandler = async (req, res, next) => {
  try {
    await cartService.clearCart(getAuthUser(req).id);
    successResponse(res, null, "Cart cleared successfully");
  } catch (error) {
    next(error);
  }
};
