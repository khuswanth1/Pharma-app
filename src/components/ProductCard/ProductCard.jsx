import React from "react";
import { Link } from "react-router-dom";
import { Favorite, FavoriteBorder, NotificationsActive, NotificationsNone, Add, Remove, Star, TrendingDown, FiberManualRecord } from "@mui/icons-material";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { toast } from "react-toastify";

const ProductCard = ({ product, categorySlug }) => {
  const { cart, addToCart, updateQuantity } = useCart();
  const { 
    isWishlisted, 
    addToWishlist, 
    removeFromWishlist, 
    wishlists,
    toggleRestockAlert,
    hasRestockAlert
  } = useWishlist();

  // Find item in cart
  const cartItem = cart.find((item) => String(item.id) === String(product.id));
  const quantity = cartItem ? cartItem.quantity : 0;

  // Determine standard properties
  const price = Math.round(product.final_price);
  const cost = Math.round(product.cost || product.final_price);
  const isDiscounted = cost > price;
  const discountPercent = isDiscounted ? Math.round(((cost - price) / cost) * 100) : 0;

  const stock = product.stock !== undefined ? product.stock : 100;
  const isLowStock = stock > 0 && stock <= 50;
  const isOutOfStock = stock === 0;

  const handleHeartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted(product.id)) {
      Object.keys(wishlists).forEach((listName) => {
        removeFromWishlist(product.id, listName);
      });
      toast.info(`Removed ${product.name} from Wishlist`);
    } else {
      addToWishlist(product, "My Medicines");
      toast.success(`Added ${product.name} to Wishlist! ❤️`);
    }
  };

  const handleNotifyMe = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleRestockAlert(product.id);
    if (hasRestockAlert(product.id)) {
      toast.info(`Removed restock alert for ${product.name}`);
    } else {
      toast.success(`We will notify you when ${product.name} is back in stock! 🔔`);
    }
  };

  return (
    <div className="group relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:border-orangeBrand/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between h-[420px] overflow-visible">
      {/* BADGES SECTION */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {/* Discount Save badge */}
        {isDiscounted && (
          <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
            Save {discountPercent}%
          </span>
        )}
      </div>

      {/* WISHLIST HEART ICON */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={handleHeartClick}
          className={`p-2 rounded-full border shadow-sm transition-all duration-300 hover:scale-110 ${
            isWishlisted(product.id)
              ? "bg-rose-500 border-rose-500 text-white"
              : "bg-white border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-300"
          }`}
        >
          {isWishlisted(product.id)
            ? <Favorite sx={{ width: 16, height: 16 }} />
            : <FavoriteBorder sx={{ width: 16, height: 16 }} />}
        </button>
      </div>

      {/* MAIN CARD CONTENTS */}
      <Link
        to={`/ProductDetail/Detail/${categorySlug || product.category || "diabetes-care"}/${product.id}`}
        className="block mt-4 flex-1 flex flex-col justify-between"
      >
        {/* PRODUCT IMAGE */}
        <div className="w-full h-32 flex justify-center items-center mt-3 overflow-hidden rounded-2xl bg-gray-50/50 group-hover:bg-orange-50/20 transition-all duration-300">
          <img
            src={Array.isArray(product.images) ? product.images[0] : product.images}
            alt={product.name}
            className="h-28 object-contain group-hover:scale-105 transition-all duration-300"
          />
        </div>

        {/* INFO COLUMN */}
        <div className="mt-4 flex-1 flex flex-col justify-end">
          {/* MANUFACTURER */}
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
            {product.manufacturer || product.brand || "Generics"}
          </span>

          {/* NAME */}
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mt-1 leading-tight group-hover:text-orangeBrand transition duration-200">
            {product.name}
          </h3>

          {/* RATINGS */}
          <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-500 font-semibold">
            <Star sx={{ width: 13, height: 13, color: "#f59e0b" }} /><span>{product.rating || "4.5"}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-400 font-medium">({product.highlights?.pack_size || "1 strip"})</span>
          </div>

          {/* PRICES AND PRICE DROP ALERTS */}
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-gray-900">₹{price}</span>
              {isDiscounted && (
                <span className="text-gray-400 line-through text-xs font-semibold">₹{cost}</span>
              )}
            </div>

            {/* Price Drop visual display */}
            {isDiscounted && (
              <div className="text-[11px] text-green-600 font-bold mt-0.5 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-md w-fit">
                <TrendingDown sx={{ width: 13, height: 13 }} /> Price Dropped ₹{cost - price} ({discountPercent}%)
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* FOOTER ACTIONS AND STOCK BADGES */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
        {/* Stock Availability indicator */}
        <div className="flex flex-col">
          {isOutOfStock ? (
            <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 bg-rose-50 px-2 py-0.5 rounded-md">
              <FiberManualRecord className="text-rose-500" sx={{ fontSize: 8 }} /> Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-[11px] font-extrabold text-amber-600 flex items-center gap-1.5 bg-amber-50 px-2 py-0.5 rounded-md">
              <FiberManualRecord className="text-amber-500" sx={{ fontSize: 8 }} /> Low Stock ({stock} left)
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-md">
              <FiberManualRecord className="text-emerald-500 animate-pulse" sx={{ fontSize: 8 }} /> In Stock
            </span>
          )}
        </div>

        {/* ADD TO CART ACTION OR NOTIFY ME */}
        <div className="flex justify-end">
          {isOutOfStock ? (
            <button
              onClick={handleNotifyMe}
              className={`flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-300 ${
                hasRestockAlert(product.id)
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-orangeBrand hover:border-orangeBrand hover:text-white"
              }`}
            >
              {hasRestockAlert(product.id)
                ? <NotificationsActive sx={{ width: 14, height: 14 }} />
                : <NotificationsNone sx={{ width: 14, height: 14 }} />}
              <span>{hasRestockAlert(product.id) ? "Alert Set" : "Notify Me"}</span>
            </button>
          ) : quantity === 0 ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, 1);
                toast.success(`Added ${product.name} to Cart! 🛒`);
              }}
              className="px-5 py-1.5 text-xs rounded-full bg-orangeBrand text-white font-extrabold shadow-sm hover:bg-orangeBrand-light hover:shadow-md transition-all active:scale-95 duration-200"
            >
              ADD
            </button>
          ) : (
            <div className="flex items-center gap-2.5 border border-orangeBrand px-2.5 py-1 rounded-full bg-orange-50/30">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(product.id, quantity - 1);
                }}
                className="text-orangeBrand font-black hover:scale-125 transition-all text-xs"
              >
                <Remove sx={{ width: 12, height: 12 }} />
              </button>
              <span className="font-extrabold text-xs text-gray-800 w-4 text-center">{quantity}</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
                className="text-orangeBrand font-black hover:scale-125 transition-all text-xs"
              >
                <Add sx={{ width: 12, height: 12 }} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
