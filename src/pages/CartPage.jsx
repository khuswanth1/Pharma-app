import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/Cart/CartItem";
import { LocalOffer, LocationOn, Info, Percent, ArrowForward, Delete, ShoppingCart } from "@mui/icons-material";
import { toast } from "react-toastify";
import { fetchAllProducts } from "../api/productService";

const CartPage = () => {
  const {
    cart,
    cartLoading,
    retailTotal,
    retailDiscount,
    couponDiscount,
    gst,
    deliveryCharges,
    handlingFee,
    grandTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDetails,
    selectedAddress,
    isAddressValidForDelivery,
    requiresPrescription,
    uploadedPrescription,
    addToCart,
    clearCart
  } = useCart();

  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState("");
  const [catalog, setCatalog] = useState([]);

  // Load the full product catalog from the backend (MySQL) once
  useEffect(() => {
    let active = true;
    fetchAllProducts().then((data) => {
      if (active) setCatalog(Array.isArray(data) ? data : []);
    });
    return () => {
      active = false;
    };
  }, []);

  // Dynamic recommendations: 3 random catalog items not already in the cart
  const recommendations = useMemo(() => {
    const available = catalog.filter(
      (p) => !cart.some((item) => String(item.id) === String(p.id))
    );
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }, [cart, catalog]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) {
      toast.warn("Please enter a coupon code.");
      return;
    }
    const result = await applyCoupon(couponInput.trim());
    if (result.success) {
      toast.success(result.message);
      setCouponInput("");
    } else {
      toast.error("You entered a wrong coupon code!");
    }
  };


  const handleCheckoutValidation = () => {
    // 1. Login status check
    const isLoggedIn = !!localStorage.getItem("user");
    if (!isLoggedIn) {
      toast.warn("Please log in to complete your checkout.");
      navigate("/login");
      return;
    }

    // 2. Address delivery verification
    if (!isAddressValidForDelivery()) {
      toast.error("Pharmacy only delivers to Hyderabad at this time. Please update shipping address.");
      return;
    }

    // 3. Prescription validation check
    if (requiresPrescription && !uploadedPrescription) {
      toast.error("Your cart contains restricted medicines. Please upload a doctor's prescription to proceed.");
      return;
    }

    // 4. Cart stock validation
    const hasOutOfStock = cart.some((item) => item.stock === 0);
    if (hasOutOfStock) {
      toast.error("Some items are out of stock. Please remove them before checkout.");
      return;
    }

    navigate("/checkout");
  };

  // Estimated Delivery Text calculation based on current address
  const estimatedDeliveryText = useMemo(() => {
    if (selectedAddress?.city?.toLowerCase() === "hyderabad") {
      return "Delivery in 30 mins (Express)";
    }
    return "Delivery Tomorrow by 10 AM";
  }, [selectedAddress]);

  // Show loading skeleton while cart is being synced from the backend
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-slate-50/30 p-4 md:p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div className="h-8 w-56 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-5 w-20 bg-slate-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm h-36 animate-pulse bg-slate-100" />
            ))}
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
            <div className="h-32 bg-slate-100 rounded-3xl animate-pulse" />
            <div className="h-56 bg-slate-100 rounded-3xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-12 flex flex-col justify-center items-center">
        <div className="bg-white border rounded-3xl p-10 md:p-16 text-center shadow-sm flex flex-col justify-center items-center gap-5 max-w-xl">
          <div className="w-24 h-24 bg-orange-50 rounded-full flex justify-center items-center text-orangeBrand shadow-inner animate-bounce">
            <ShoppingCart sx={{ fontSize: 40 }} />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Your Cart is Empty</h2>
          <p className="text-gray-400 text-sm max-w-sm">
            Save time and money! Browse our catalog, add healthcare essentials, and qualify for free shipping.
          </p>
          <Link
            to="/home/All"
            className="px-8 py-3 bg-orangeBrand hover:bg-orangeBrand-light text-white font-extrabold text-xs rounded-full shadow-md hover:shadow-lg transition-all duration-200"
          >
            Explore Medicines
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-8 max-w-7xl mx-auto">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center mb-8 border-b pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Shopping Cart</h1>
        </div>
        <button
          onClick={() => {
            clearCart();
            toast.info("Cart cleared successfully.");
          }}
          className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-all"
        >
          Clear Cart
        </button>
      </div>

      {/* CORE COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: PRODUCTS LIST */}
        <div className="lg:col-span-2 space-y-5">
          <h3 className="text-base font-extrabold text-gray-800 uppercase tracking-wider mb-2">Cart Items ({cart.length})</h3>
          
          <div className="space-y-4">
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          {/* FREQUENTLY BOUGHT TOGETHER carousel suggestions */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm mt-8">
            <h3 className="text-sm font-black text-gray-800 flex items-center gap-1.5 mb-4">
              Frequently Bought Together
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendations.map((rec) => {
                const discountPercent = Math.round(((rec.cost - rec.final_price) / rec.cost) * 100);
                return (
                  <div key={rec.id} className="relative bg-slate-50 border border-gray-100 rounded-2xl p-4 flex flex-col justify-between h-[240px] hover:shadow-md transition overflow-hidden">
                    {/* Discount badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-2.5 left-2.5 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}

                    <div>
                      <div className="w-16 h-16 bg-white rounded-xl flex justify-center items-center p-1.5 mx-auto mt-2 border border-slate-100 shadow-sm">
                        <img src={Array.isArray(rec.images) ? rec.images[0] : (rec.images || rec.images_url)} alt={rec.name} className="h-full object-contain" />
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-2 mt-2.5 leading-tight text-center">{rec.name}</h4>
                    </div>
                    
                    <div className="mt-3 flex items-end justify-between">
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-black text-gray-900 leading-none">₹{rec.final_price}</span>
                        {rec.cost > rec.final_price && (
                          <span className="text-[10px] text-gray-400 line-through font-bold mt-1">₹{rec.cost}</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          addToCart(rec, 1);
                          toast.success(`Added ${rec.name} to Cart!`);
                        }}
                        className="px-3 py-1 bg-orangeBrand hover:bg-orangeBrand-light text-white text-[10px] font-black rounded-lg transition active:scale-95 shadow-sm"
                      >
                        + ADD
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRICE SUMMARY & VALIDATION SECTION */}
        <div className="space-y-6">
          
          {/* ADDRESS CONFIGURATION CARD */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <LocationOn className="text-orangeBrand" sx={{ fontSize: 16 }} />
              Delivery Location
            </h3>
            
            <div className="p-3 bg-slate-50 border rounded-2xl text-xs space-y-1">
              <div className="flex justify-between font-bold text-gray-700">
                <span>{selectedAddress?.type} Address</span>
                <span className="text-[10px] text-gray-400">Default</span>
              </div>
              <p className="text-gray-500 font-medium leading-relaxed mt-1">{selectedAddress?.details}</p>
            </div>

            {/* Availability Check status banner */}
            {isAddressValidForDelivery() ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-[11px] text-emerald-800 font-bold flex items-center gap-2">
                <span>Medicine Available In Hyderabad</span>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-[11px] text-rose-800 font-bold flex flex-col gap-1">
                <span>Service Unavailable outside Hyderabad</span>
                <Link to="/addresses" className="text-orangeBrand underline font-bold mt-1 text-[10px]">Change Address</Link>
              </div>
            )}

            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 bg-slate-100 p-2.5 rounded-2xl">
              <Info className="text-gray-400" sx={{ fontSize: 14 }} />
              <span>Estimated arrival: <span className="font-extrabold text-slate-700">{estimatedDeliveryText}</span></span>
            </div>
          </div>

          {/* COUPONS SECTION */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <LocalOffer className="text-orangeBrand" sx={{ fontSize: 16 }} />
              Apply Coupons
            </h3>
            
            {appliedCoupon ? (
              <div className="flex justify-between items-center bg-orange-50 border border-orange-200/60 rounded-2xl p-3 text-xs">
                <div className="flex items-center gap-2">
                  <Percent className="text-orange-800" sx={{ fontSize: 16 }} />
                  <span className="font-extrabold text-orange-800 uppercase">
                    "{appliedCoupon}" Applied ({couponDetails ? `${couponDetails.discountPercentage * 100}%` : ""} OFF)
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="p-1 rounded-full text-rose-500 hover:bg-rose-50 transition active:scale-95 flex items-center justify-center"
                  title="Remove Coupon"
                >
                  <Delete sx={{ fontSize: 16 }} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME20, FIRSTORDER"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-orangeBrand font-semibold uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-orangeBrand hover:bg-orangeBrand-light text-white font-extrabold text-xs rounded-2xl shadow-sm transition active:scale-95 duration-200"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* PRICE SUMMARY BILLING */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Payment Summary</h3>
            
            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Total M.R.P:</span>
                <span>₹{retailTotal}</span>
              </div>
              {retailDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Retail Discount:</span>
                  <span>-₹{retailDiscount}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges:</span>
                <span>{deliveryCharges === 0 ? <span className="text-green-600 font-extrabold uppercase">Free</span> : `₹${deliveryCharges}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Handling Charges:</span>
                <span>{handlingFee === 0 ? <span className="text-green-600 font-extrabold uppercase">Free</span> : `₹${handlingFee}`}</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3.5 flex justify-between font-black text-gray-900 text-sm bg-slate-50 p-3 rounded-2xl shadow-sm">
              <span>Grand Total:</span>
              <span>₹{grandTotal}</span>
            </div>
             
             

            {/* CHECKOUT BUTTON WITH VALIDATIONS */}
            <button
              onClick={handleCheckoutValidation}
              className="w-full mt-4 bg-orangeBrand hover:bg-orangeBrand-light text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transition active:scale-95 duration-200"
            >
              <span>Proceed to Checkout</span>
              <ArrowForward className="animate-pulse" sx={{ fontSize: 16 }} />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default CartPage;
