import * as cartService from "./cart.service.js";
import { utils } from "../../../../../shared/index.js";
const { successResponse, errorResponse, asyncHandler } = utils;

export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cart = await cartService.getCartByUserId(userId);
  return successResponse(res, cart, "Cart fetched successfully");
});

export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const productData = req.body;
  const cart = await cartService.addItemToCart(userId, productData);
  return successResponse(res, cart, "Item added to cart");
});

export const updateCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity, variant } = req.body;
  const cart = await cartService.updateItemQuantity(userId, productId, quantity, variant);
  return successResponse(res, cart, "Cart updated successfully");
});

export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId } = req.params;
  const { variant } = req.body; // Variant might be needed to distinguish items
  const cart = await cartService.removeItemFromCart(userId, productId, variant);
  return successResponse(res, cart, "Item removed from cart");
});

export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await cartService.clearCart(userId);
  return successResponse(res, null, "Cart cleared successfully");
});
