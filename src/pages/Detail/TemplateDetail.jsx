import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";

// Context hooks
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";

// Components
import ProductCard from "../../components/ProductCard/ProductCard";

// MUI Icons
import { Favorite, FavoriteBorder, Star, ChevronLeft, ChevronRight, LocalShipping, Loop, WarningAmber, KeyboardArrowDown } from "@mui/icons-material";

// Product API (backend / MySQL)
import { fetchCategoryProducts } from "../../api/productService";

const TemplateDetail = () => {
  const { categorySlug, id } = useParams();

  const { cart, addToCart, updateQuantity, isRxRequired } = useCart();
  const {
    isWishlisted,
    addToWishlist,
    removeFromWishlist,
    wishlists,
    toggleRestockAlert,
    hasRestockAlert,
  } = useWishlist();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [mainImage, setMainImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const scrollRef = useRef(null);
  const likeScrollRef = useRef(null);
  const galleryRef = useRef(null);

  const price = (v) => (typeof v === "number" ? Math.round(v) : v);

  /* ---------------------------------------------
        LOAD ALL JSON FILES
  --------------------------------------------- */
  useEffect(() => {
    let active = true;
    setLoading(true);

    if (!categorySlug) {
      setProduct(null);
      setLoading(false);
      return;
    }

    // Fetch the category's products (grouped by sub-type) from the backend
    fetchCategoryProducts(categorySlug)
      .then((data) => {
        if (!active) return;

        // Flatten the grouped sub-type arrays into a single product list
        const products = Object.entries(data || {})
          .filter(([_, value]) => Array.isArray(value))
          .flatMap(([subCat, items]) =>
            items.map((p) => ({
              ...p,
              category: categorySlug,
            }))
          );

        // Set all products for the "similar items" section
        setAllProducts(products);

        // Find product by ID
        const foundProduct = products.find((p) => String(p.id) === String(id));

        if (!foundProduct) {
          setProduct(null);
          setLoading(false);
          return;
        }

        // Normalize images
        let images = [];
        if (Array.isArray(foundProduct.images)) {
          images = foundProduct.images;
        } else if (typeof foundProduct.images === "string") {
          images = [foundProduct.images];
        } else if (foundProduct.images?.url) {
          images = [foundProduct.images.url];
        }

        setProduct({ ...foundProduct, images });
        setMainImage(images[0] || "");
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setProduct(null);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [categorySlug, id]);

  // Scroll Listener for Sticky Bar
  useEffect(() => {
    const handleScroll = () => {
      if (galleryRef.current) {
        const rect = galleryRef.current.getBoundingClientRect();
        // The top sticky bar should appear when the bottom of the left column gallery leaves the viewport (e.g. goes above 72px header threshold)
        if (rect.bottom < 72) {
          setShowStickyBar(true);
        } else {
          setShowStickyBar(false);
        }
      } else {
        // Fallback if ref is not initialized
        const scrollContainer = document.querySelector(".overflow-auto");
        const currentScroll = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
        setShowStickyBar(currentScroll > 350);
      }
    };

    // Use capturing phase (true) to intercept scrolls inside scrollable wrapper divs!
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // Reset scroll position and sticky bar when product changes
  useEffect(() => {
    const scrollContainer = document.querySelector(".overflow-auto");
    if (scrollContainer) {
      try {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      } catch (err) {
        scrollContainer.scrollTop = 0;
      }
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setShowStickyBar(false);
  }, [id, categorySlug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center flex flex-col justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orangeBrand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading medicine details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center min-h-[400px] flex flex-col justify-center items-center">
        <WarningAmber sx={{ fontSize: 48, color: "#ef4444" }} className="mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Product Not Found</h2>
        <p className="text-gray-500 mt-2">
          The requested medicine details could not be loaded. Please check the URL or try searching.
        </p>
        <Link
          to="/home"
          className="mt-6 px-6 py-2.5 bg-orangeBrand hover:bg-orangeBrand-light text-white font-bold text-xs rounded-full shadow-md transition"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Reactive quantity from global CartContext
  const cartItem = cart.find((item) => String(item.id) === String(product.id));
  const qty = cartItem ? cartItem.quantity : 0;

  // Stock status checks
  const stock = product.stock !== undefined ? product.stock : 100;
  const isOutOfStock = stock === 0;

  // Rx Required checks
  const rxNeeded = isRxRequired(product);

  // Gallery Navigation Index
  const currentImgIdx = product.images.indexOf(mainImage);
  const handlePrevImage = () => {
    if (product.images.length <= 1) return;
    const prevIdx = (currentImgIdx - 1 + product.images.length) % product.images.length;
    setMainImage(product.images[prevIdx]);
  };
  const handleNextImage = () => {
    if (product.images.length <= 1) return;
    const nextIdx = (currentImgIdx + 1) % product.images.length;
    setMainImage(product.images[nextIdx]);
  };

  // Wishlist Handling
  const handleWishlistToggle = (e) => {
    e.preventDefault();
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

  // Notify Me / Restock Alert Handling
  const handleNotifyMe = () => {
    toggleRestockAlert(product.id);
    if (hasRestockAlert(product.id)) {
      toast.info(`Removed restock alert for ${product.name}`);
    } else {
      toast.success(`We will notify you when ${product.name} is back in stock! 🔔`);
    }
  };

  // Cart actions
  const handleAddToCart = () => {
    addToCart(product, 1);
    toast.success(`Added ${product.name} to Cart! 🛒`);
  };

  const handleInc = () => {
    addToCart(product, 1);
  };

  const handleDec = () => {
    updateQuantity(product.id, qty - 1);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-sans text-gray-800 bg-white">
      {/* ================================
          BREADCRUMBS
      ================================= */}
      <div className="text-[11px] md:text-xs text-gray-500 mb-6 flex flex-wrap items-center gap-1.5 font-medium">
        <Link to="/home" className="hover:text-orangeBrand transition">
          Home
        </Link>
        <span className="text-gray-300">/</span>
        <Link to={`/home/${categorySlug}`} className="capitalize hover:text-orangeBrand transition">
          {categorySlug.replace("-", " ")}
        </Link>
        <span className="text-gray-300">/</span>
        <Link to={`/home/${categorySlug}`} className="text-gray-800 font-semibold line-clamp-1 hover:text-orangeBrand transition">
          {product.name}
        </Link>
      </div>

      {/*  TOP DETAIL SECTION (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-10">
        
        {/* LEFT COLUMN: IMAGES GALLERY & ADD TO CART (5 cols on lg) */}
        <div ref={galleryRef} className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col gap-4">
          <div className="flex gap-4">
            {/* Vertical Thumbnails (hidden on small screen, flex on md+) */}
            {product.images.length > 1 && (
              <div className="hidden md:flex flex-col gap-2 overflow-y-auto max-h-[350px] no-scrollbar flex-shrink-0">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border bg-white flex justify-center items-center p-1 transition-all ${
                      mainImage === img
                        ? "border-orangeBrand shadow-sm ring-1 ring-orangeBrand/30"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img src={img} className="max-w-full max-h-full object-contain" alt="" />
                  </button>
                ))}
                {product.images.length > 5 && (
                  <div className="flex justify-center mt-1">
                    <div className="animate-bounce text-gray-300">
                      <KeyboardArrowDown sx={{ fontSize: 16 }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Image Box */}
            <div className="relative flex-1 bg-white border border-gray-100 rounded-2xl p-4 flex justify-center items-center min-h-[300px] md:min-h-[350px] shadow-sm">
              <div className="w-full h-[280px] md:h-[320px] flex justify-center items-center">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleWishlistToggle}
                className={`absolute top-3 right-3 p-2.5 rounded-full border shadow-sm transition-all duration-300 hover:scale-105 z-20 ${
                  isWishlisted(product.id)
                    ? "bg-rose-500 border-rose-500 text-white"
                    : "bg-white border-gray-200 text-gray-400 hover:text-rose-500"
                }`}
              >
                {isWishlisted(product.id) ? (
                  <Favorite sx={{ fontSize: 18 }} />
                ) : (
                  <FavoriteBorder sx={{ fontSize: 18 }} />
                )}
              </button>

              {/* Discount Tag */}
              {product.cost > product.final_price && (
                <div className="absolute top-3 left-3 bg-[#4f8f43] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                  {Math.round(((product.cost - product.final_price) / product.cost) * 100)}% OFF
                </div>
              )}

              {/* Left and Right Navigation Chevrons inside Main Image Box */}
              {product.images.length > 1 && (
                <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
                  <button
                    onClick={(e) => { e.preventDefault(); handlePrevImage(); }}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex justify-center items-center text-gray-500 hover:text-gray-800 shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
                  >
                    <ChevronLeft sx={{ fontSize: 16 }} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleNextImage(); }}
                    className="w-7 h-7 rounded-full bg-white border border-gray-200 flex justify-center items-center text-gray-500 hover:text-gray-800 shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
                  >
                    <ChevronRight sx={{ fontSize: 16 }} />
                  </button>
                </div>
              )}

              {/* Small horizontal Thumbnails for mobile */}
              {product.images.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 md:hidden overflow-x-auto no-scrollbar py-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`w-8 h-8 rounded border bg-white flex justify-center items-center p-0.5 ${
                        mainImage === img ? "border-orangeBrand" : "border-gray-200"
                      }`}
                    >
                      <img src={img} className="max-w-full max-h-full object-contain" alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Premium Price Tag & Add To Cart Button Row spanning full column width */}
          <div className="flex items-center justify-between gap-4 mt-2 bg-white px-2 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
            {/* Left side: Price & Discount badge details */}
            <div className="flex items-center gap-3 pl-1">
              <div className="bg-[#4f8f43] text-white px-4 py-2 rounded-xl font-bold text-lg md:text-xl flex items-center shadow-md">
                ₹{price(product.final_price)}
              </div>
              {product.cost > product.final_price && (
                <div className="flex flex-col">
                  <span className="text-gray-400 line-through text-xs md:text-sm font-bold leading-none mb-1">
                    ₹{price(product.cost)}
                  </span>
                  <span className="text-[#4f8f43] text-[10px] md:text-xs font-black uppercase tracking-wide leading-none">
                    {Math.round(((product.cost - product.final_price) / product.cost) * 100)}% OFF
                  </span>
                </div>
              )}
            </div>

            {/* Right side: Add To Cart or Qty Controls */}
            <div className="flex-1 max-w-[140px] md:max-w-[200px]">
              {isOutOfStock ? (
                <button
                  onClick={handleNotifyMe}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-md ${
                    hasRestockAlert(product.id)
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-gray-300 text-gray-700 hover:bg-orangeBrand hover:border-orangeBrand hover:text-white"
                  }`}
                >
                  {hasRestockAlert(product.id) ? "Alert Set" : "Notify Me"}
                </button>
              ) : qty === 0 ? (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-orangeBrand hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-extrabold text-sm md:text-base tracking-wide transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-md"
                >
                  Add To Cart
                </button>
              ) : (
                <div className="w-full flex items-center justify-between bg-orangeBrand text-white py-2 px-4 rounded-xl font-extrabold text-sm md:text-base shadow-md">
                  <button onClick={handleDec} className="hover:scale-110 active:scale-95 px-2 text-xl font-black">
                    −
                  </button>
                  <span>{qty} {qty === 1 ? "Item" : "Items"}</span>
                  <button onClick={handleInc} className="hover:scale-110 active:scale-95 px-2 text-xl font-black">
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRODUCT INFO, DETAILS, OFFERS (7 cols on lg) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div>
            {/* Brand/Category link */}
            <div className="text-xs font-semibold text-orangeBrand mb-1.5 flex items-center gap-1">
              <span className="cursor-pointer hover:underline">{product.brand || "Generics"}</span>
              <ChevronRight sx={{ fontSize: 14 }} />
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight mb-2">
              {product.name}
            </h1>

            {/* Net Qty & Rating Badge */}
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-4 flex-wrap">
              {product.net_quantity && (
                <span>Net Qty: {product.net_quantity}</span>
              )}
              {product.net_quantity && <span className="text-gray-300">•</span>}
              <div className="flex items-center gap-1 bg-[#1f8c3c] text-white px-2 py-0.5 rounded text-[11px] font-bold">
                <span>{product.rating || "4.5"}</span>
                <Star sx={{ fontSize: 11 }} />
              </div>
              <span className="text-gray-400">(14.5K reviews)</span>
            </div>

            {/* Medical Prescription Warning */}
            {rxNeeded && (
              <div className="mb-4 bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2.5 text-rose-800 text-[11px] leading-relaxed">
                <WarningAmber sx={{ color: "#e11d48", fontSize: 18 }} className="flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-rose-900 mb-0.5">📄 Prescription Required</span>
                  This medicine requires a valid prescription from a registered medical practitioner. Please upload it during checkout to proceed with delivery.
                </div>
              </div>
            )}

            {/* Coupons & Offers Section */}
            <div className="border border-gray-150 rounded-xl p-4 bg-white mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                Coupons & Offers
              </h3>
              <div className="flex flex-col gap-3">
                {/* BHIM UPI cashback offer */}
                <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-2.5 text-xs hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex justify-center items-center font-bold text-[10px]">
                      BHIM
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Upto ₹50 cashback with BHIM App</div>
                      <div className="text-[10px] text-gray-400">On payments above ₹299</div>
                    </div>
                  </div>
                  <ChevronRight sx={{ fontSize: 16, color: "#9ca3af" }} />
                </div>

                {/* Amazon Pay Balance offer */}
                <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-2.5 text-xs hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex justify-center items-center font-bold text-[10px]">
                      AMZN
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Get upto ₹50 Cashback on using Amazon Pay Balance</div>
                      <div className="text-[10px] text-gray-400">Min transaction ₹199</div>
                    </div>
                  </div>
                  <ChevronRight sx={{ fontSize: 16, color: "#9ca3af" }} />
                </div>

                {/* POP UPI cashback offer */}
                <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-2.5 text-xs hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex justify-center items-center font-bold text-[10px]">
                      POP
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Flat ₹50 cashback with POP UPI</div>
                      <div className="text-[10px] text-gray-400">Valid once per user</div>
                    </div>
                  </div>
                  <ChevronRight sx={{ fontSize: 16, color: "#9ca3af" }} />
                </div>

                {/* Visa credit card offer */}
                <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-2.5 text-xs hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1a1f71]/5 text-[#1a1f71] flex justify-center items-center font-bold text-[10px]">
                      VISA
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Flat ₹100 off with Visa Platinum Credit Cards</div>
                      <div className="text-[10px] text-gray-400">On order value above ₹799</div>
                    </div>
                  </div>
                  <ChevronRight sx={{ fontSize: 16, color: "#9ca3af" }} />
                </div>

                {/* BOBCARD offer */}
                <div className="flex items-center justify-between border border-dashed border-gray-200 rounded-lg p-2.5 text-xs hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex justify-center items-center font-bold text-[10px]">
                      BOB
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">Get ₹100 off with BOBCARD</div>
                      <div className="text-[10px] text-gray-400">Min order value ₹999</div>
                    </div>
                  </div>
                  <ChevronRight sx={{ fontSize: 16, color: "#9ca3af" }} />
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-xs font-semibold text-[#d6335c] hover:underline cursor-pointer">
                  View all coupons
                </span>
              </div>
            </div>

            {/* Circular Delivery/Exchange trust Badges */}
            <div className="flex items-center gap-6 mt-4 pl-1">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border border-gray-200 flex justify-center items-center mb-1 text-gray-600">
                  <Loop sx={{ fontSize: 20 }} />
                </div>
                <span className="text-[10px] font-medium text-gray-700">3 Days Exchange</span>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border border-gray-200 flex justify-center items-center mb-1 text-gray-600">
                  <LocalShipping sx={{ fontSize: 20 }} />
                </div>
                <span className="text-[10px] font-medium text-gray-700">Fast Delivery</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/*  HIGHLIGHTS SECTION (GRID TABLE) */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Highlights</h2>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden text-xs md:text-sm">
          {/* Brand */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Brand
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.brand || "Generics"}
            </div>
          </div>

          {/* Product Type */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Product Type
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.highlights?.product_type || product.medicine_type || "Supplement"}
            </div>
          </div>

          {/* Model Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Model Name
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.composition || "Standard"}
            </div>
          </div>

          {/* Fragrance */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Fragrance
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.fragrance || product.highlights?.fragrance || "Standard / Unscented"}
            </div>
          </div>

          {/* Item Form */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Item Form
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.highlights?.product_type || "Tablet/Capsule/Liquid"}
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Key Features
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.description || "N/A"}
            </div>
          </div>

          {/* Weight */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Weight
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.weight || product.net_quantity || "N/A"}
            </div>
          </div>

          {/* Ingredients */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Ingredients
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {Array.isArray(product.ingredients) ? product.ingredients.join(", ") : product.ingredients || "N/A"}
            </div>
          </div>

          {/* Usage Instruction */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Usage Instruction
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.information?.usage_instruction || "Use as directed by the physician."}
            </div>
          </div>

          {/* Unit */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Unit
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.net_quantity || "1 Pack"}
            </div>
          </div>

          {/* Packaging Type */}
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Packaging Type
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.packaging_type || "Box / Bottle / Strip"}
            </div>
          </div>
        </div>
      </div>

      {/*  INFORMATION SECTION (GRID TABLE)  */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Information</h2>
        
        <div className="border border-gray-200 rounded-lg overflow-hidden text-xs md:text-sm">
          {/* Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Disclaimer
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-500 italic">
              {product.information?.disclaimer || "Consult doctor before use. Read labels carefully."}
            </div>
          </div>

          {/* Customer Care Details */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Customer Care Details
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.customer_support || "Email: support@anandpharmacy.com, Phone: +91-40-12345678"}
            </div>
          </div>

          {/* Seller Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Seller Name
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.seller_name || "Pharmacy App Retail"}
            </div>
          </div>

          {/* Seller Address */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Seller Address
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.seller_address || "Pharmacy App, Madhapur, Hyderabad, Telangana, India"}
            </div>
          </div>

          {/* Seller License No. */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Seller License No.
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.seller_license || "AP-PHARM2026-HYD"}
            </div>
          </div>

          {/* Manufacturer Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Manufacturer / Marketer Name
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.manufactured_by || product.manufacturer || "Generic Pharma Labs"}
            </div>
          </div>

          {/* Country Of Origin */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-gray-150">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Country Of Origin
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.country_of_origin || product.highlights?.country_of_origin || "India"}
            </div>
          </div>

          {/* Shelf Life */}
          <div className="grid grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-4 bg-gray-50 p-3 font-semibold text-gray-600 border-r border-gray-150">
              Shelf Life
            </div>
            <div className="md:col-span-8 bg-white p-3 text-gray-800">
              {product.highlights?.shelf_life || "24 Months"}
            </div>
          </div>
        </div>
      </div>

      {/*  SIMILAR PRODUCTS  */}
      <div className="mt-12 relative border-t border-gray-100 pt-10">
        <h2 className="text-xl font-black text-gray-800 mb-6">Similar Products</h2>

        {/* PRODUCT SCROLLER */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-6 pb-6 no-scrollbar scroll-smooth px-1"
        >
          {allProducts.slice(0, 12).map((sim) => (
            <div key={sim.id} className="min-w-[260px] max-w-[260px] flex-shrink-0">
              <ProductCard product={sim} categorySlug={sim.category || categorySlug} />
            </div>
          ))}
        </div>
      </div>

      {/*  YOU MIGHT ALSO LIKE  */}
      <div className="mt-12 relative border-t border-gray-100 pt-10">
        <h2 className="text-xl font-black text-gray-800 mb-6">You Might Also Like</h2>

        {/* PRODUCT SCROLLER */}
        <div
          ref={likeScrollRef}
          className="flex overflow-x-auto gap-6 pb-6 no-scrollbar scroll-smooth px-1"
        >
          {allProducts.slice(12, 24).map((sim) => (
            <div key={sim.id} className="min-w-[260px] max-w-[260px] flex-shrink-0">
              <ProductCard product={sim} categorySlug={sim.category || categorySlug} />
            </div>
          ))}
        </div>
      </div>

      {/*  STICKY FLOATING BAR ON SCROLL DOWN (Zepto Style) */}
      <div 
        className={`fixed top-[108px] lg:top-[64px] left-0 right-0 z-40 bg-white border-b border-gray-100 shadow-md transition-all duration-300 transform ${
          showStickyBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between gap-6">
          {/* Left section: Product Thumbnail & Name & Prices */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative w-12 h-12 md:w-16 md:h-16 border border-gray-100 rounded-xl p-1 bg-white flex-shrink-0 flex justify-center items-center shadow-sm">
              <img
                src={product.images[0] || mainImage}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="min-w-0 flex flex-col gap-1">
              <h2 className="text-xs md:text-sm font-bold text-gray-800 line-clamp-1">
                {product.name}
              </h2>
              <div className="flex items-center gap-2">
                <div className="bg-[#4f8f43] text-white px-2.5 py-0.5 rounded font-bold text-xs md:text-sm shadow-sm">
                  ₹{price(product.final_price)}
                </div>
                {product.cost > product.final_price && (
                  <span className="text-gray-400 line-through text-[10px] md:text-xs font-semibold">
                    ₹{price(product.cost)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right section: Pink Add to Cart or Stepper Controls */}
          <div className="max-w-[130px] md:max-w-[170px] w-full flex-shrink-0">
            {isOutOfStock ? (
              <button
                onClick={handleNotifyMe}
                className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-sm ${
                  hasRestockAlert(product.id)
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-orangeBrand hover:border-orangeBrand hover:text-white"
                }`}
              >
                {hasRestockAlert(product.id) ? "Alert Set" : "Notify Me"}
              </button>
            ) : qty === 0 ? (
              <button
                onClick={handleAddToCart}
                className="w-full bg-orangeBrand hover:bg-orange-600 text-white py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm tracking-wide transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm"
              >
                Add To Cart
              </button>
            ) : (
              <div className="w-full flex items-center justify-between bg-orangeBrand text-white py-2 px-3 rounded-xl font-bold text-xs md:text-sm shadow-sm">
                <button onClick={handleDec} className="hover:scale-110 active:scale-95 px-1.5 text-base">
                  −
                </button>
                <span>{qty} {qty === 1 ? "Item" : "Items"}</span>
                <button onClick={handleInc} className="hover:scale-110 active:scale-95 px-1.5 text-base">
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateDetail;