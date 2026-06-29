import apiClient from "./apiClient";

// Backend wraps responses as { success, message, data }
const unwrap = (res) => res?.data?.data ?? res?.data;

/**
 * Fetch (or lazily create) a user's cart.
 * GET /api/cart/{userId}
 * Returns: Cart { id, userId, updatedAt, items: CartItem[] }
 */
export const getCart = async (userId) => {
  try {
    const res = await apiClient.get(`/api/cart/${userId}`);
    return unwrap(res) || { userId, items: [] };
  } catch (error) {
    console.error("getCart failed:", error);
    return { userId, items: [] };
  }
};

/**
 * Add (or replace) an item in the cart.
 * POST /api/cart/{userId}/items
 * Body: CartItem { productId, productName, quantity, price }
 * Returns: Cart (full updated cart)
 */
export const addCartItem = async (userId, item) => {
  try {
    const res = await apiClient.post(`/api/cart/${userId}/items`, {
      productId: String(item.productId),
      productName: item.productName,
      quantity: Number(item.quantity),
      price: Number(item.price),
      notes: item.notes || "",
    });
    return unwrap(res);
  } catch (error) {
    console.error("addCartItem failed:", error);
    throw error?.response?.data?.message || "Failed to add item to cart.";
  }
};

/**
 * Update quantity of an item in the cart (same as add – backend replaces by productId).
 * POST /api/cart/{userId}/items
 */
export const updateCartItem = async (userId, item) => {
  return addCartItem(userId, item);
};

/**
 * Remove a single product from the cart.
 * DELETE /api/cart/{userId}/items/{productId}
 */
export const removeCartItem = async (userId, productId) => {
  try {
    const res = await apiClient.delete(`/api/cart/${userId}/items/${productId}`);
    return unwrap(res);
  } catch (error) {
    console.error("removeCartItem failed:", error);
    throw error?.response?.data?.message || "Failed to remove item from cart.";
  }
};

/** Clear all items in the cart on the backend. */
export const clearCartApi = async (userId) => {
  try {
    const res = await apiClient.delete(`/api/cart/${userId}/clear`);
    return unwrap(res);
  } catch (error) {
    console.error("clearCartApi failed:", error);
    throw error?.response?.data?.message || "Failed to clear cart.";
  }
};

/**
 * Validate a coupon code with backend database.
 * GET /api/cart/coupons/validate/{code}
 */
export const validateCouponApi = async (code) => {
  try {
    const res = await apiClient.get(`/api/cart/coupons/validate/${code}`);
    return res.data; // Returns ApiResponse<Coupon> { success, message, data: Coupon }
  } catch (error) {
    console.error("validateCouponApi failed:", error);
    return { success: false, message: error?.response?.data?.message || "Invalid coupon code!" };
  }
};

