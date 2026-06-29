import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { getCart, addCartItem, removeCartItem, validateCouponApi, clearCartApi } from "../api/cartService";
import { fetchAllProducts } from "../api/productService";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Cart state: [ { ...product, quantity, notes, isSubscription } ]
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("pharmacy_cart_items");
    return saved ? JSON.parse(saved) : [];
  });

  // Loading indicator while cart is being synced from the backend
  const [cartLoading, setCartLoading] = useState(false);
  const [cartSynced, setCartSynced] = useState(false);

  // Active Coupon code state
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    return localStorage.getItem("pharmacy_coupon") || "";
  });

  const [couponDetails, setCouponDetails] = useState(null);

  // Sync coupon details from backend on load/refresh if a coupon code was previously applied
  useEffect(() => {
    if (appliedCoupon) {
      validateCouponApi(appliedCoupon).then((res) => {
        if (res && res.success && res.data) {
          setCouponDetails(res.data);
        } else {
          // If backend failed (like a 500 or offline database), use local fallback coupon definitions
          const localCoupons = {
            "WELCOME20": { code: "WELCOME20", discountPercentage: 0.20, maxDiscountAmount: 200.0, description: "Save 20% on your medicine (Up to ₹200)" },
            "FIRSTORDER": { code: "FIRSTORDER", discountPercentage: 0.10, maxDiscountAmount: 500.0, description: "Save 10% on entire purchase!" },
            "KUSHU100": { code: "KUSHU100", discountPercentage: 0.25, maxDiscountAmount: 100.0, description: "Save 25% on your medicine (Up to ₹100)" },
            "PHARMA123": { code: "PHARMA123", discountPercentage: 0.15, maxDiscountAmount: 300.0, description: "Save 15% on your medicine (Up to ₹300)" },
            "RAO100": { code: "RAO100", discountPercentage: 0.30, maxDiscountAmount: 100.0, description: "Save 30% on your medicine (Up to ₹100)" }
          };
          const upperCode = appliedCoupon.toUpperCase();
          if (localCoupons[upperCode]) {
            setCouponDetails(localCoupons[upperCode]);
          } else {
            setAppliedCoupon("");
            localStorage.removeItem("pharmacy_coupon");
          }
        }
      });
    }
  }, [appliedCoupon]);

  // Selected address state (default to Hyderabad)
  const [selectedAddress, setSelectedAddress] = useState(() => {
    const saved = localStorage.getItem("pharmacy_selected_address");
    return saved ? JSON.parse(saved) : { type: "Home", city: "Hyderabad", details: "Flat 204, Rainbow Residency, Hyderabad, Telangana" };
  });

  // Prescription uploaded state
  const [uploadedPrescription, setUploadedPrescription] = useState(() => {
    return localStorage.getItem("pharmacy_prescription_uploaded") === "true";
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Sync with backend cart when user logs in or changes
  // ─────────────────────────────────────────────────────────────────────────────
  const syncBackendCart = useCallback(async () => {
    if (!user?.id) return;
    setCartLoading(true);
    try {
      // Fetch product catalog & backend cart in parallel
      const [allProductsList, backendCart] = await Promise.all([
        fetchAllProducts(),
        getCart(user.id),
      ]);

      if (backendCart && Array.isArray(backendCart.items)) {
        const enrichedItems = backendCart.items.map((item) => {
          const matchedProduct = allProductsList.find(
            (p) => String(p.id) === String(item.productId)
          );

          if (matchedProduct) {
            return {
              ...matchedProduct,
              quantity: item.quantity,
              notes: item.notes || "",
              isSubscription: false,
            };
          }
          // Fallback if product details not in catalog
          return {
            id: item.productId,
            name: item.productName,
            final_price: Number(item.price),
            cost: Number(item.price),
            quantity: item.quantity,
            images: ["/assets/placeholder.png"],
            notes: item.notes || "",
            isSubscription: false,
          };
        });

        // Deduplicate items by product ID (summing quantities)
        const uniqueItemsMap = new Map();
        enrichedItems.forEach((item) => {
          const itemId = String(item.id);
          const existing = uniqueItemsMap.get(itemId);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            uniqueItemsMap.set(itemId, { ...item });
          }
        });

        setCart(Array.from(uniqueItemsMap.values()));
      }
      setCartSynced(true);
    } catch (err) {
      console.error("Failed to sync backend cart:", err);
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      // Clear cart on logout to prevent data leakage between users
      setCart([]);
      setCartSynced(false);
      return;
    }
    syncBackendCart();
  }, [user, syncBackendCart]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Persist cart locally for offline resilience
  // ─────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("pharmacy_cart_items", JSON.stringify(cart));
  }, [cart]);

  // Persist coupon
  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem("pharmacy_coupon", appliedCoupon);
    } else {
      localStorage.removeItem("pharmacy_coupon");
    }
  }, [appliedCoupon]);

  // Persist address
  useEffect(() => {
    localStorage.setItem("pharmacy_selected_address", JSON.stringify(selectedAddress));
  }, [selectedAddress]);

  // Sync selectedAddress from saved addresses in localStorage
  useEffect(() => {
    const syncSelectedAddress = () => {
      let list = [];
      try {
        list = JSON.parse(localStorage.getItem("pharma_addresses")) || [];
      } catch (e) {
        list = [];
      }
      const primary = list.find((a) => a.primary) || list[0];
      if (primary) {
        setSelectedAddress({
          id: primary.id,
          type: primary.typeTag || "Other",
          city: (primary.fullText || "").toLowerCase().includes("hyderabad") ? "Hyderabad" : "Other",
          details: primary.fullText || `${primary.flat || ""} ${primary.building || ""} ${primary.landmark || ""}`.trim(),
        });
      }
    };

    window.addEventListener("storage", syncSelectedAddress);
    syncSelectedAddress();
    return () => window.removeEventListener("storage", syncSelectedAddress);
  }, []);

  // Persist prescription status
  useEffect(() => {
    localStorage.setItem("pharmacy_prescription_uploaded", String(uploadedPrescription));
  }, [uploadedPrescription]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Add Item to Cart
  // API call is fired BEFORE setCart so React StrictMode double-invoke of the
  // updater never causes a second request to the backend.
  // ─────────────────────────────────────────────────────────────────────────────
  const addToCart = (product, qty = 1, notes = "", isSubscription = false) => {
    // Read current state snapshot outside the updater (pure, no double-fire risk)
    const existing = cart.find((item) => String(item.id) === String(product.id));
    const isRegulated = isRxRequired(product);
    const maxQty = isRegulated ? 10 : 20;
    const newQty = existing
      ? Math.min(existing.quantity + qty, maxQty)
      : Math.min(qty, maxQty);

    // Fire exactly ONE backend call, outside the setState updater
    if (user?.id) {
      addCartItem(user.id, {
        productId: String(product.id),
        productName: product.name,
        quantity: newQty,
        price: product.final_price,
      }).catch((err) => console.error("addToCart backend sync failed:", err));
    }

    // Pure state update — no side effects inside
    setCart((prev) => {
      const existingInPrev = prev.find((item) => String(item.id) === String(product.id));
      if (existingInPrev) {
        return prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: newQty, notes: notes || item.notes, isSubscription: isSubscription || item.isSubscription }
            : item
        );
      }
      return [...prev, { ...product, quantity: newQty, notes, isSubscription }];
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Remove Item from Cart
  // ─────────────────────────────────────────────────────────────────────────────
  const removeFromCart = (productId) => {
    if (user?.id) {
      removeCartItem(user.id, String(productId)).catch((err) =>
        console.error("removeFromCart backend sync failed:", err)
      );
    }
    setCart((prev) => prev.filter((item) => String(item.id) !== String(productId)));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Update Item Quantity
  // API call is fired BEFORE setCart to prevent Strict Mode double-invoke.
  // ─────────────────────────────────────────────────────────────────────────────
  const updateQuantity = (productId, qty) => {
    // Read snapshot outside updater
    const item = cart.find((i) => String(i.id) === String(productId));
    if (!item) return;

    const isRegulated = isRxRequired(item);
    const maxQty = isRegulated ? 10 : 20;
    const finalQty = Math.max(0, Math.min(qty, maxQty));

    if (finalQty === 0) {
      // Fire delete before setCart
      if (user?.id) {
        removeCartItem(user.id, String(productId)).catch((err) =>
          console.error("updateQuantity (remove) backend sync failed:", err)
        );
      }
      setCart((prev) => prev.filter((i) => String(i.id) !== String(productId)));
      return;
    }

    // Fire update before setCart
    if (user?.id) {
      addCartItem(user.id, {
        productId: String(productId),
        productName: item.name,
        quantity: finalQty,
        price: item.final_price,
      }).catch((err) => console.error("updateQuantity backend sync failed:", err));
    }

    // Pure state update
    setCart((prev) =>
      prev.map((i) =>
        String(i.id) === String(productId) ? { ...i, quantity: finalQty } : i
      )
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Update Item Notes (syncs with backend)
  // ─────────────────────────────────────────────────────────────────────────────
  const updateItemNotes = (productId, notes) => {
    const item = cart.find((i) => String(i.id) === String(productId));
    if (user?.id && item) {
      addCartItem(user.id, {
        productId: String(productId),
        productName: item.name || item.productName,
        quantity: item.quantity,
        price: item.final_price || item.price,
        notes: notes,
      }).catch((err) => console.error("updateItemNotes backend sync failed:", err));
    }
    setCart((prev) =>
      prev.map((i) => (String(i.id) === String(productId) ? { ...i, notes } : i))
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Toggle Monthly Subscription (local-only)
  // ─────────────────────────────────────────────────────────────────────────────
  const toggleSubscription = (productId) => {
    setCart((prev) =>
      prev.map((i) =>
        String(i.id) === String(productId) ? { ...i, isSubscription: !i.isSubscription } : i
      )
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Clear Cart — removes all items from backend then clears local state
  // ─────────────────────────────────────────────────────────────────────────────
  const clearCart = () => {
    if (user?.id) {
      clearCartApi(user.id).catch((err) =>
        console.error("clearCart backend sync failed:", err)
      );
    }
    setCart([]);
    setAppliedCoupon("");
    setUploadedPrescription(false);
  };
  

  // ─────────────────────────────────────────────────────────────────────────────
  // Rx / Prescription helper
  // ─────────────────────────────────────────────────────────────────────────────
  const isRxRequired = (product) => {
    if (!product) return false;
    const disclaimer = (product.information?.disclaimer || "").toLowerCase();
    const exemption = (product.exemption_type || "").toLowerCase();
    const type = (product.highlights?.product_type || "").toLowerCase();
    const name = (product.name || "").toLowerCase();
    const uses = (product.uses || []).map((u) => u.toLowerCase());

    return (
      exemption.includes("prescription") ||
      disclaimer.includes("prescription") ||
      type.includes("injection") ||
      type.includes("insulin") ||
      name.includes("insulin") ||
      uses.some((u) => u.includes("cardiac") || u.includes("diabetes")) ||
      product.rx_required === true
    );
  };

  // Check if cart contains any prescription items
  const requiresPrescription = cart.some((item) => isRxRequired(item));

  // Address delivery validation
  const isAddressValidForDelivery = () => {
    return selectedAddress?.city?.toLowerCase() === "hyderabad";
  };

  // Coupon system
  // ─────────────────────────────────────────────────────────────────────────────
  const applyCoupon = async (code) => {
    const res = await validateCouponApi(code);
    if (res && res.success && res.data) {
      setAppliedCoupon(res.data.code);
      setCouponDetails(res.data);
      return { success: true, message: res.message || "Coupon applied successfully!" };
    }
    
    // Graceful fallback to client-side validation if backend throws 500 error or database is offline
    const localCoupons = {
      "WELCOME20": { code: "WELCOME20", discountPercentage: 0.20, maxDiscountAmount: 200.0, description: "Save 20% on your medicine (Up to ₹200)" },
      "FIRSTORDER": { code: "FIRSTORDER", discountPercentage: 0.10, maxDiscountAmount: 500.0, description: "Save 10% on entire purchase!" },
      "KUSHU100": { code: "KUSHU100", discountPercentage: 0.25, maxDiscountAmount: 100.0, description: "Save 25% on your medicine (Up to ₹100)" },
      "PHARMA123": { code: "PHARMA123", discountPercentage: 0.15, maxDiscountAmount: 300.0, description: "Save 15% on your medicine (Up to ₹300)" },
      "RAO100": { code: "RAO100", discountPercentage: 0.30, maxDiscountAmount: 100.0, description: "Save 30% on your medicine (Up to ₹100)" }
    };
    
    const upperCode = code.trim().toUpperCase();
    if (localCoupons[upperCode]) {
      setAppliedCoupon(localCoupons[upperCode].code);
      setCouponDetails(localCoupons[upperCode]);
      return { success: true, message: "Coupon applied successfully! (Offline fallback)" };
    }
    
    return { success: false, message: res?.message || "Invalid coupon code!" };
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setCouponDetails(null);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Billing Calculations
  // ─────────────────────────────────────────────────────────────────────────────
  const subtotal = cart.reduce((sum, item) => sum + Math.round(item.final_price) * item.quantity, 0);
  const retailTotal = cart.reduce((sum, item) => sum + Math.round(item.cost || item.final_price) * item.quantity, 0);
  const retailDiscount = retailTotal - subtotal;

  let couponDiscount = 0;
  if (couponDetails) {
    const pct = couponDetails.discountPercentage || 0;
    const maxVal = couponDetails.maxDiscountAmount || 999999;
    couponDiscount = Math.min(Math.round(subtotal * pct), maxVal);
  }

  const gst = Math.round((subtotal - couponDiscount) * 0.18);
  const deliveryCharges = subtotal >= 300 || subtotal === 0 ? 0 : 30;
  const handlingFee = subtotal >= 200 || subtotal === 0 ? 0 : 70;
  const grandTotal = Math.max(0, subtotal - couponDiscount + gst + deliveryCharges + handlingFee);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        // Cart state
        cart,
        cartLoading,
        cartSynced,
        syncBackendCart,

        // CRUD operations
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemNotes,
        toggleSubscription,
        clearCart,

        // Coupon
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        couponDetails,

        // Address
        selectedAddress,
        setSelectedAddress,
        isAddressValidForDelivery,

        // Prescription
        uploadedPrescription,
        setUploadedPrescription,
        requiresPrescription,
        isRxRequired,

        // Billing
        retailTotal,
        retailDiscount,
        subtotal,
        couponDiscount,
        gst,
        deliveryCharges,
        handlingFee,
        grandTotal,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
