import { models } from "../../../../../shared/index.js";
const { Cart } = models;

export const getCartByUserId = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [], totalAmount: 0, totalItems: 0 });
  }
  return cart;
};

export const addItemToCart = async (userId, productData) => {
  let cart = await getCartByUserId(userId);

  const { productId, vendorId, name, image, price, quantity, variant } = productData;

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString() && 
              JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ productId, vendorId, name, image, price, quantity, variant });
  }

  calculateTotals(cart);
  return await cart.save();
};

export const updateItemQuantity = async (userId, productId, quantity, variant) => {
  const cart = await getCartByUserId(userId);

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString() && 
              JSON.stringify(item.variant) === JSON.stringify(variant)
  );

  if (itemIndex > -1) {
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }
    calculateTotals(cart);
    return await cart.save();
  }
  throw new Error("Item not found in cart");
};

export const removeItemFromCart = async (userId, productId, variant) => {
  const cart = await getCartByUserId(userId);

  cart.items = cart.items.filter(
    (item) => !(item.productId.toString() === productId.toString() && 
               JSON.stringify(item.variant) === JSON.stringify(variant))
  );

  calculateTotals(cart);
  return await cart.save();
};

export const clearCart = async (userId) => {
  const cart = await getCartByUserId(userId);
  cart.items = [];
  cart.totalAmount = 0;
  cart.totalItems = 0;
  return await cart.save();
};

const calculateTotals = (cart) => {
  cart.totalItems = cart.items.reduce((acc, item) => acc + item.quantity, 0);
  cart.totalAmount = cart.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
};
