import apiClient from "./apiClient";

// Backend wraps responses as { success, message, data }
const unwrap = (res) => res?.data?.data ?? res?.data;

/**
 * Fetch one category's products grouped by sub-type
 * e.g. { top_rated: [...], tablets: [...], recommendations: [...] }
 */
export const fetchCategoryProducts = async (slug) => {
  try {
    const res = await apiClient.get(`/api/products/category/${slug}`);
    return unwrap(res) || {};
  } catch (error) {
    console.error("fetchCategoryProducts failed:", error);
    return {};
  }
};

/** Flat list of every product (each enriched with categorySlug / trueCategorySlug). */
export const fetchAllProducts = async () => {
  try {
    const res = await apiClient.get("/api/products/all");
    return unwrap(res) || [];
  } catch (error) {
    console.error("fetchAllProducts failed:", error);
    return [];
  }
};

/** Top-rated products across all categories (used by search suggestions). */
export const fetchTopRatedProducts = async () => {
  try {
    const res = await apiClient.get("/api/products/top-rated");
    return unwrap(res) || [];
  } catch (error) {
    console.error("fetchTopRatedProducts failed:", error);
    return [];
  }
};

/** Search products by name. */
export const searchProducts = async (query) => {
  if (!query || !query.trim()) return [];
  try {
    const res = await apiClient.get("/api/products/search", {
      params: { q: query.trim() },
    });
    return unwrap(res) || [];
  } catch (error) {
    console.error("searchProducts failed:", error);
    return [];
  }
};

/** Book a Lab Test slot */
export const bookLabTest = async (bookingData) => {
  try {
    const res = await apiClient.post("/api/products/lab-bookings", bookingData);
    return unwrap(res);
  } catch (error) {
    console.error("bookLabTest failed:", error);
    throw error?.response?.data?.message || "Failed to book lab test slot.";
  }
};

/** Fetch available time slots */
export const fetchAvailableSlots = async () => {
  try {
    const res = await apiClient.get("/api/products/lab-bookings/slots");
    return unwrap(res) || [];
  } catch (error) {
    console.error("fetchAvailableSlots failed:", error);
    return [];
  }
};

/** Fetch user's lab test bookings */
export const getUserLabBookings = async (userId) => {
  try {
    const res = await apiClient.get(`/api/products/lab-bookings/user/${userId}`);
    return unwrap(res) || [];
  } catch (error) {
    console.error("getUserLabBookings failed:", error);
    return [];
  }
};

/** Fetch all lab test bookings */
export const getAllLabBookings = async () => {
  try {
    const res = await apiClient.get("/api/products/lab-bookings");
    return unwrap(res) || [];
  } catch (error) {
    console.error("getAllLabBookings failed:", error);
    return [];
  }
};
