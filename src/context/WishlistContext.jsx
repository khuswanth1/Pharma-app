import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { getWishlistAPI, addToWishlistAPI, removeFromWishlistAPI, deleteWishlistAPI } from "../api/wishlistService";

const WishlistContext = createContext();

// Helper to get stored token
const getToken = () => localStorage.getItem('pharmacy_token');

export const WishlistProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.id || user?.userId;
  const wishlistsRef = useRef({});

  // Multiple wishlists mapping: { listName: [productObjects] }
  const [wishlists, setWishlists] = useState(() => {
    const saved = localStorage.getItem("pharmacy_wishlists");
    return saved
      ? JSON.parse(saved)
      : {
          "My Medicines": [],
          "Monthly Medicines": [],
          "Parents Medicines": [],
        };
  });

  const [restockAlerts, setRestockAlerts] = useState(() => {
    const saved = localStorage.getItem("pharmacy_restock_alerts");
    return saved ? JSON.parse(saved) : [];
  });

  const [loading, setLoading] = useState(false);

  // Load wishlist from backend whenever userId changes
  useEffect(() => {
    const token = getToken();
    if (userId && token) {
      setLoading(true);
      getWishlistAPI(userId)
        .then((response) => {
          if (response && response.success && response.data) {
            const backendData = response.data;
            // Ensure default tabs always exist
            const DEFAULT_LISTS = ["My Medicines", "Monthly Medicines", "Parents Medicines"];
            const normalizedWishlists = {};
            DEFAULT_LISTS.forEach((name) => { normalizedWishlists[name] = []; });
            Object.keys(backendData).forEach((listName) => {
              normalizedWishlists[listName] = (backendData[listName] || []).map((item) => ({
                id: item.productId,
                name: item.productName,
                final_price: Number(item.price) || 0,
                cost: Number(item.cost) || 0,
                images: item.image ? [item.image] : [],
                image: item.image || "",
                category: item.category || "",
                categorySlug: item.category || "",
                addedAt: item.addedAt
              }));
            });
            setWishlists(normalizedWishlists);
            wishlistsRef.current = normalizedWishlists;
          }
        })
        .catch((err) => {
          console.error("[Wishlist] Error fetching from backend:", err);
          // Fallback to localStorage on network error
          const saved = localStorage.getItem("pharmacy_wishlists");
          if (saved) {
            try { setWishlists(JSON.parse(saved)); } catch (e) {}
          }
        })
        .finally(() => setLoading(false));
    } else if (!userId) {
      // Not logged in — use local storage only
      const saved = localStorage.getItem("pharmacy_wishlists");
      const DEFAULT = { "My Medicines": [], "Monthly Medicines": [], "Parents Medicines": [] };
      setWishlists(saved ? (JSON.parse(saved) || DEFAULT) : DEFAULT);
    }
  }, [userId]);

  // Keep ref in sync and persist local storage backup
  useEffect(() => {
    wishlistsRef.current = wishlists;
    localStorage.setItem("pharmacy_wishlists", JSON.stringify(wishlists));
  }, [wishlists]);

  // Persist restock alerts
  useEffect(() => {
    localStorage.setItem("pharmacy_restock_alerts", JSON.stringify(restockAlerts));
  }, [restockAlerts]);

  // Add list
  const createWishlist = (name) => {
    if (!name || wishlists[name]) return false;
    setWishlists((prev) => ({ ...prev, [name]: [] }));
    return true;
  };

  // Delete list
  const deleteWishlist = async (name) => {
    if (name === "My Medicines") return; // Keep default list
    setWishlists((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    const token = getToken();
    if (userId && token) {
      try {
        await deleteWishlistAPI(userId, name);
      } catch (err) {
        console.error("[Wishlist] Failed to delete from backend:", err);
      }
    }
  };

  // Add product to list
  const addToWishlist = async (product, listName = "My Medicines") => {
    // Use ref to avoid stale closure issue
    const currentList = wishlistsRef.current[listName] || [];
    if (currentList.some((item) => String(item.id) === String(product.id))) {
      return; // Already exists
    }

    const imageUrl = product.image
      || (Array.isArray(product.images) && product.images[0])
      || "";

    const updatedProduct = {
      ...product,
      image: imageUrl,
      addedAt: new Date().toISOString(),
    };

    setWishlists((prev) => ({
      ...prev,
      [listName]: [...(prev[listName] || []), updatedProduct],
    }));

    const token = getToken();
    if (userId && token) {
      try {
        await addToWishlistAPI(userId, {
          listName,
          productId: String(product.id),
          productName: product.name,
          price: product.final_price || 0,
          cost: product.cost || product.final_price || 0,
          image: imageUrl,
          category: product.category || product.categorySlug || ""
        });
      } catch (err) {
        console.error("[Wishlist] Failed to add to backend:", err);
      }
    }
  };

  // Remove product from list
  const removeFromWishlist = async (productId, listName = "My Medicines") => {
    setWishlists((prev) => {
      const list = prev[listName] || [];
      const updatedList = list.filter((item) => String(item.id) !== String(productId));
      return { ...prev, [listName]: updatedList };
    });

    const token = getToken();
    if (userId && token) {
      try {
        await removeFromWishlistAPI(userId, listName, String(productId));
      } catch (err) {
        console.error("[Wishlist] Failed to remove from backend:", err);
      }
    }
  };

  // Check if item is in ANY wishlist
  const isWishlisted = (productId) => {
    return Object.values(wishlists).some((list) =>
      list.some((item) => String(item.id) === String(productId))
    );
  };

  // Get list names containing product
  const getListsContainingProduct = (productId) => {
    return Object.keys(wishlists).filter((listName) =>
      wishlists[listName].some((item) => String(item.id) === String(productId))
    );
  };

  // Total unique wishlist count
  const getWishlistCount = () => {
    const uniqueIds = new Set();
    Object.values(wishlists).forEach((list) => {
      list.forEach((item) => uniqueIds.add(String(item.id)));
    });
    return uniqueIds.size;
  };

  // Toggle "Notify Me When Available" alert
  const toggleRestockAlert = (productId) => {
    setRestockAlerts((prev) => {
      const idStr = String(productId);
      if (prev.includes(idStr)) {
        return prev.filter((id) => id !== idStr);
      } else {
        return [...prev, idStr];
      }
    });
  };

  // Check restock alert state
  const hasRestockAlert = (productId) => {
    return restockAlerts.includes(String(productId));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlists,
        loading,
        createWishlist,
        deleteWishlist,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        getListsContainingProduct,
        getWishlistCount,
        toggleRestockAlert,
        hasRestockAlert,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};
