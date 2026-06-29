import apiClient from './apiClient';

// Get grouped wishlists for a user
export const getWishlistAPI = async (userId) => {
  try {
    const response = await apiClient.get(`/api/cart/wishlist/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch wishlist.';
  }
};

// Add an item to user's wishlist
export const addToWishlistAPI = async (userId, item) => {
  try {
    const response = await apiClient.post(`/api/cart/wishlist/${userId}`, item);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add item to wishlist.';
  }
};

// Remove a product from a specific wishlist list
export const removeFromWishlistAPI = async (userId, listName, productId) => {
  try {
    const response = await apiClient.delete(`/api/cart/wishlist/${userId}/${encodeURIComponent(listName)}/${productId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to remove item from wishlist.';
  }
};

// Delete an entire wishlist list
export const deleteWishlistAPI = async (userId, listName) => {
  try {
    const response = await apiClient.delete(`/api/cart/wishlist/${userId}/${encodeURIComponent(listName)}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete wishlist.';
  }
};
