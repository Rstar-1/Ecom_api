import { Cart } from "./cart.model";
import { Product } from "../products/product.model";
import { AppError, identifierFilter } from "../../utils";
import type { AddToCartBody, CartVariant } from "./cart.types";

export type CartDocument = Awaited<ReturnType<typeof getCartByUserId>>;

/** Variant as stored by Mongoose (fields may be null) or sent by the client. */
type StoredVariant = { size?: string | null; color?: string | null } | null | undefined;

const normalizeVariant = (variant: StoredVariant): string =>
  JSON.stringify({ size: variant?.size ?? null, color: variant?.color ?? null });

const isSameItem = (
  item: { productId?: unknown; variant?: StoredVariant },
  productId: string,
  variant?: CartVariant
): boolean => String(item.productId) === productId && normalizeVariant(item.variant) === normalizeVariant(variant);

const calculateTotals = (cart: CartDocument): void => {
  cart.totalItems = cart.items.reduce((acc, item) => acc + (item.quantity ?? 0), 0);
  cart.totalAmount = cart.items.reduce((acc, item) => acc + (item.price ?? 0) * (item.quantity ?? 0), 0);
};

const toQuantity = (value: unknown, fallback: number): number => {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n)) throw AppError.badRequest("Quantity must be a number");
  return Math.trunc(n);
};

export const getCartByUserId = async (userId: string) => {
  const cart = await Cart.findOne({ userId });
  if (cart) return cart;
  return Cart.create({ userId, items: [], totalAmount: 0, totalItems: 0 });
};

export const addItemToCart = async (userId: string, data: AddToCartBody) => {
  const { variant } = data;
  if (!data.productId) throw AppError.badRequest("productId is required");

  const quantity = toQuantity(data.quantity, 1);
  if (quantity <= 0) throw AppError.badRequest("Quantity must be at least 1");

  // Name, price and image always come from the product record, never from the client
  const product = await Product.findOne({
    ...identifierFilter(data.productId),
    isDeleted: false,
    isActive: true,
  });
  if (!product) throw AppError.notFound("Product not found or unavailable");
  const productId = product._id.toString();

  const cart = await getCartByUserId(userId);
  const existing = cart.items.find((item) => isSameItem(item, productId, variant));

  if (existing) {
    existing.quantity = (existing.quantity ?? 0) + quantity;
  } else {
    cart.items.push({
      productId: product._id,
      vendorId: product.createdBy,
      name: product.productName,
      image: product.image || product.images[0] || "",
      price: product.price,
      quantity,
      variant,
    });
  }

  calculateTotals(cart);
  return cart.save();
};

export const updateItemQuantity = async (
  userId: string,
  productId: string | undefined,
  rawQuantity: unknown,
  variant?: CartVariant
) => {
  if (!productId) throw AppError.badRequest("productId is required");
  const quantity = toQuantity(rawQuantity, 0);

  const cart = await getCartByUserId(userId);
  const index = cart.items.findIndex((item) => isSameItem(item, productId, variant));
  const item = cart.items[index];
  if (index === -1 || !item) throw AppError.notFound("Item not found in cart");

  if (quantity <= 0) {
    cart.items.splice(index, 1);
  } else {
    item.quantity = quantity;
  }

  calculateTotals(cart);
  return cart.save();
};

export const removeItemFromCart = async (userId: string, productId: string, variant?: CartVariant) => {
  const cart = await getCartByUserId(userId);
  const index = cart.items.findIndex((item) => isSameItem(item, productId, variant));
  if (index === -1) throw AppError.notFound("Item not found in cart");

  cart.items.splice(index, 1);
  calculateTotals(cart);
  return cart.save();
};

export const clearCart = async (userId: string) => {
  const cart = await getCartByUserId(userId);
  cart.items.splice(0, cart.items.length);
  cart.totalAmount = 0;
  cart.totalItems = 0;
  return cart.save();
};
