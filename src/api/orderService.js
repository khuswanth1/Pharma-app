import apiClient from "./apiClient";

// Backend wraps responses as { success, message, data }
const unwrap = (res) => res?.data?.data ?? res?.data;

/**
 * Create a new order.
 * order: { userId, totalAmount, items: [{ productId, productName, quantity, price }] }
 */
export const createOrder = async (order) => {
  try {
    const res = await apiClient.post("/api/orders", order);
    return unwrap(res);
  } catch (error) {
    throw error.response?.data?.message || "Failed to create order.";
  }
};

/** List a user's orders, newest first. */
export const getUserOrders = async (userId) => {
  try {
    const res = await apiClient.get(`/api/orders/${userId}`);
    return unwrap(res) || [];
  } catch (error) {
    console.error("getUserOrders failed:", error);
    return [];
  }
};

/** Fetch a single order by its ID. */
export const getOrderDetails = async (orderId) => {
  try {
    const res = await apiClient.get(`/api/orders/detail/${orderId}`);
    return unwrap(res);
  } catch (error) {
    console.error("getOrderDetails failed:", error);
    throw error.response?.data?.message || "Failed to fetch order details.";
  }
};

/**
 * Update an order's status.
 * status: one of the backend OrderStatus values (e.g. CREATED, PAID, SHIPPED...).
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const res = await apiClient.patch(`/api/orders/${orderId}/status`, null, {
      params: { status },
    });
    return unwrap(res);
  } catch (error) {
    throw error.response?.data?.message || "Failed to update order status.";
  }
};

/**
 * Update order delivery details (name, phone, address, instructions) in database.
 */
export const updateOrderDeliveryDetails = async (orderId, details) => {
  try {
    const res = await apiClient.patch(`/api/orders/${orderId}/delivery-details`, details);
    return unwrap(res);
  } catch (error) {
    throw error.response?.data?.message || "Failed to update delivery details.";
  }
};
