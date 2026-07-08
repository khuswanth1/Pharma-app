import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import CategoryPage from "./Medical/CategoryPage";
import { useCart } from "../context/CartContext";
import { WavingHand } from "@mui/icons-material";

export default function Home() {
  const { cart } = useCart();

  return (
    <div className="home-wrapper pt-[10px] lg:pt-[10px]">
      <div className="home-content px-4 py-6 lg:py-10">
        
        {/* ABANDONED CART REMINDER */}
        {cart.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-3xl p-5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-3">
            <div className="flex items-center gap-3">
              <WavingHand className="animate-bounce" sx={{ fontSize: 28 }} />
              <div>
                <h3 className="text-sm font-black tracking-wide uppercase">You have items left in your cart!</h3>
                <p className="text-xs text-orange-100 font-medium mt-0.5">Resume your health purchase and get delivery within 30 minutes in Hyderabad.</p>
              </div>
            </div>
            <Link
              to="/cart"
              className="px-6 py-2.5 bg-white text-orangeBrand hover:bg-orange-50 font-extrabold text-xs rounded-full shadow-md hover:shadow-lg transition active:scale-95 duration-200 whitespace-nowrap"
            >
              View Cart
            </Link>
          </div>
        )}

        <Routes>
          {/* Default redirect to ALL */}
          <Route path="/" element={<Navigate to="All" replace />} />

          {/* ONE UNIVERSAL COMPONENT */}
          <Route path=":categorySlug" element={<CategoryPage />} />
        </Routes>

      </div>
    </div>
  );
}
