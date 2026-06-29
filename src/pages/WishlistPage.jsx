import React, { useState, useMemo } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import ProductCard from "../components/ProductCard/ProductCard";
import { Share, ArrowForward, ContentCopy, Mail, WhatsApp, Favorite } from "@mui/icons-material";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const WishlistPage = () => {
  const { 
    wishlists, 
    removeFromWishlist,
    loading
  } = useWishlist();
  
  const { addToCart } = useCart();

  const [activeList, setActiveList] = useState("My Medicines");
  const [sortBy, setSortBy] = useState("latest");
  const [showShareModal, setShowShareModal] = useState(false);

  const activeProducts = useMemo(() => wishlists[activeList] || [], [wishlists, activeList]);

  // Sort products based on criteria
  const sortedProducts = useMemo(() => {
    const listCopy = [...activeProducts];
    if (sortBy === "priceLowHigh") {
      return listCopy.sort((a, b) => a.final_price - b.final_price);
    }
    if (sortBy === "priceHighLow") {
      return listCopy.sort((a, b) => b.final_price - a.final_price);
    }
    // Default: Sort by latest added (addedAt timestamp)
    return listCopy.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  }, [activeProducts, sortBy]);

  // Identify discounted items in this list for Price Drop Alerts
  const priceDroppedProducts = useMemo(() => {
    return activeProducts.filter((p) => Math.round(p.cost || p.final_price) > Math.round(p.final_price));
  }, [activeProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex flex-col items-center justify-center p-8 gap-4">
        <div className="w-12 h-12 border-4 border-orangeBrand border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-450 font-black uppercase tracking-wider">Syncing your wishlist...</p>
      </div>
    );
  }

  const handleMoveAllToCart = () => {
    if (activeProducts.length === 0) return;
    activeProducts.forEach((p) => {
      addToCart(p, 1);
      removeFromWishlist(p.id, activeList);
    });
    toast.success(`Moved all items from "${activeList}" to your Cart! 🛒`);
  };

  const handleCopyLink = () => {
    const mockLink = `${window.location.origin}/wishlist/share?list=${encodeURIComponent(activeList)}`;
    navigator.clipboard.writeText(mockLink);
    toast.success("Wishlist share link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Wishlists</h1>
          <p className="text-gray-500 text-sm mt-1">Organize and save your daily health and subscription medicines.</p>
        </div>

        <div className="flex items-center gap-3.5 w-full md:w-auto">
          {/* Share Wishlist button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-2xl text-xs font-bold text-gray-700 hover:border-orangeBrand hover:text-orangeBrand shadow-sm transition active:scale-95 duration-200"
          >
            <Share sx={{ fontSize: 16 }} />
            <span>Share List</span>
          </button>
        </div>
      </div>



        {/* SORTING AND MUTATORS BAR */}
        {activeProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold uppercase">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-gray-200 text-xs font-bold text-gray-700 px-3.5 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-orangeBrand"
              >
                <option value="latest">Recently Added (Latest)</option>
                <option value="priceLowHigh">Price: Low to High</option>
                <option value="priceHighLow">Price: High to Low</option>
              </select>
            </div>

            <button
              onClick={handleMoveAllToCart}
              className="flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition active:scale-95 duration-200"
            >
              <span>Move All to Cart</span>
              <ArrowForward sx={{ fontSize: 16 }} />
            </button>
          </div>
        )}

      {/* PRICE DROP ALERTS SUMMARY SECTION */}
      {priceDroppedProducts.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-green-50/50 border border-emerald-100 rounded-3xl p-5 shadow-sm animate-in fade-in">
          <h3 className="text-sm font-black text-emerald-800 flex items-center gap-1.5">
            📉 PRICE DROP NOTIFICATIONS ({priceDroppedProducts.length})
          </h3>
          <p className="text-xs text-emerald-600/90 mt-0.5">
            Great news! The following medicines in your wishlist have dropped in price. Order now to save big!
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {priceDroppedProducts.map((p) => {
              const price = Math.round(p.final_price);
              const cost = Math.round(p.cost);
              const dropPercent = Math.round(((cost - price) / cost) * 100);
              return (
                <div key={p.id} className="bg-white/90 border border-emerald-100/50 rounded-2xl px-3 py-1.5 text-xs text-slate-700 font-medium flex items-center gap-2">
                  <span className="font-bold text-gray-800">{p.name}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-400 line-through">₹{cost}</span>
                  <span className="font-bold text-emerald-600">₹{price}</span>
                  <span className="bg-emerald-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                    -{dropPercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PRODUCT GRID SECTION */}
      {sortedProducts.length === 0 ? (
        /* EMPTY STATE RENDER */
        <div className="bg-white border rounded-3xl p-16 text-center shadow-sm flex flex-col justify-center items-center gap-4 max-w-xl mx-auto mt-10">
          <div className="w-24 h-24 bg-rose-50 rounded-full flex justify-center items-center text-rose-500 shadow-inner animate-bounce">
            <Favorite sx={{ fontSize: 40 }} />
          </div>
          <h2 className="text-xl font-black text-gray-800">Your Wishlist is Empty</h2>
          <p className="text-gray-400 text-xs max-w-sm">
            Save medicines, diabetes supplies, or elderly care products to "{activeList}" for easy, recurring monthly reordering.
          </p>
          <Link
            to="/home/All"
            className="mt-2 px-6 py-2.5 bg-orangeBrand hover:bg-orangeBrand-light text-white font-bold text-xs rounded-full shadow-md transition"
          >
            Explore Medicines
          </Link>
        </div>
      ) : (
        /* ACTIVE GRID RENDER */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categorySlug={product.categorySlug || product.category || "diabetes-care"}
            />
          ))}
        </div>
      )}

      {/* SHARING OPTIONS MODAL BOARD */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
            <h3 className="text-lg font-black text-gray-800 mb-2">Share "{activeList}"</h3>
            <p className="text-xs text-gray-400 mb-5">
              Send this curated wishlist of medicines to family members, caregivers, or doctors.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* WhatsApp Share option */}
              <button
                onClick={() => {
                  const msg = `Hi! Here are the medicines I saved in my Pharmacy App "${activeList}" wishlist. Take a look: ${window.location.origin}/wishlist/share?list=${activeList}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, "_blank");
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100 rounded-2xl text-emerald-700 transition"
              >
                <WhatsApp sx={{ fontSize: 20 }} />
                <span className="text-[10px] font-bold uppercase tracking-wide">WhatsApp</span>
              </button>

              {/* Email share option */}
              <button
                onClick={() => {
                  const subject = `Curated Medicine Wishlist - Pharmacy App`;
                  const body = `Hi!\n\nHere are the medicines I saved in my Pharmacy App "${activeList}" wishlist:\n\n${window.location.origin}/wishlist/share?list=${activeList}`;
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                }}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100/70 border border-blue-100 rounded-2xl text-blue-700 transition"
              >
                <Mail sx={{ fontSize: 20 }} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Email</span>
              </button>

              {/* Copy link option */}
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-orange-50 hover:bg-orange-100/70 border border-orange-100 rounded-2xl text-orangeBrand transition"
              >
                <ContentCopy sx={{ fontSize: 20 }} />
                <span className="text-[10px] font-bold uppercase tracking-wide">Copy Link</span>
              </button>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold text-xs rounded-2xl transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
