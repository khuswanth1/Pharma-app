import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProductCard from "../../components/ProductCard/ProductCard";
import { toast } from "react-toastify";
import { Bloodtype, Favorite, Medication, Healing, HealthAndSafety, AutoAwesome, Air, FavoriteBorder, Elderly, Shield, ScienceOutlined, WhatsApp, LocalHospital, MedicalServices } from "@mui/icons-material";
import { fetchAllProducts, fetchCategoryProducts } from "../../api/productService";

export default function CategoryPage() {
  const { categorySlug: rawSlug } = useParams();
  const categorySlug = (rawSlug?.toLowerCase() === "sexual-health" || rawSlug?.toLowerCase() === "sexual-care")
    ? "sexual_care"
    : (rawSlug?.toLowerCase() === "covid-essentials")
    ? "covid-care"
    : (rawSlug?.toLowerCase() === "cold-&-immunity")
    ? "cold-immunity"
    : rawSlug?.toLowerCase() ?? "";
  const navigate = useNavigate();
  
  const categoryNames = {
    "all": "All Categories",
    "baby-care": "Baby Care",
    "skin-care": "Skin Care",
    "diabetes-care": "Diabetes Care",
    "cardiac-care": "Cardiac Care",
    "stomach-care": "Stomach Care",
    "pain-relief": "Pain Relief",
    "liver-care": "Liver Care",
    "oral-care": "Oral Care",
    "respiratory": "Respiratory Care",
    "elderly-care": "Elderly Care",
    "women-health": "Women Health",
    "first-aid": "First Aid",
    "covid-care": "Covid Essentials",
    "sexual_care": "Sexual Health",
    "cold-immunity": "Cold & Immunity"
  };
  const displayName = categoryNames[categorySlug] || (categorySlug ? categorySlug.replace(/-/g, " ") : "");

  // STATES
  const [tabs, setTabs] = useState([]);
  const [jsonData, setJsonData] = useState({});
  const [activeCategory, setActiveCategory] = useState("top_rated");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState([]);

  // LOAD ALL PRODUCTS (from backend / MySQL) FOR THE LANDING PORTAL DEALS
  useEffect(() => {
    let active = true;
    fetchAllProducts().then((data) => {
      if (active) setAllProducts(Array.isArray(data) ? data : []);
    });
    return () => {
      active = false;
    };
  }, []);

  const valueDeals = useMemo(() => {
    return allProducts.filter((p) => p.final_price <= 150).slice(0, 10);
  }, [allProducts]);

  const discountDeals = useMemo(() => {
    return allProducts.filter((p) => p.discount >= 12).slice(0, 10);
  }, [allProducts]);

  const hotSellersDeals = useMemo(() => {
    return allProducts.filter((p) => p.rating >= 4.8).slice(0, 10);
  }, [allProducts]);

  const skincareDeals = useMemo(() => {
    return allProducts.filter((p) => p.trueCategorySlug === "skin-care").slice(0, 10);
  }, [allProducts]);

  const diabetesDeals = useMemo(() => {
    return allProducts.filter((p) => p.trueCategorySlug === "diabetes-care").slice(0, 10);
  }, [allProducts]);

  // VALID CATEGORY CHECK
  const validCategories = [
    "all",
    "baby-care",
    "skin-care",
    "diabetes-care",
    "cardiac-care",
    "stomach-care",
    "pain-relief",
    "liver-care",
    "oral-care",
    "respiratory",
    "elderly-care",
    "women-health",
    "first-aid",
    "covid-care",
    "sexual_care",
    "cold-immunity"
  ];

  const isValidCategory = validCategories.includes(categorySlug);

  /* -------------------------------------------------------
      LOAD CATEGORY JSON + TABS USING SWITCH CASE
  -------------------------------------------------------- */
  useEffect(() => {
    setLoading(true);
    setProducts([]);
    setTabs([]);

    let tabList = [];
    switch (categorySlug) {
      case "all":
        tabList = [];
        break;

      case "baby-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "diapers", label: "Diapers" },
          { key: "wipes", label: "Wipes" },
          { key: "skin_care", label: "Skin Care" },
          { key: "hair_care", label: "Hair Care" },
          { key: "bathing", label: "Bathing" }
        ];
        break;

      case "skin-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "gel", label: "Gel" },
          { key: "cream", label: "Cream" },
          { key: "serum", label: "Serum" },
          { key: "lotion", label: "Lotion" }
        ];
        break;

      case "diabetes-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "insulin", label: "Insulin" },
          { key: "glucometer", label: "Glucometer" }
        ];
        break;

      case "cardiac-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "capsules", label: "Capsules" }
        ];
        break;

      case "stomach-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "powders", label: "Powders" },
          { key: "syrups", label: "Syrups" }
        ];
        break;

      case "pain-relief":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "gels", label: "Gels" },
          { key: "balm", label: "Balms" }
        ];
        break;

      case "liver-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "capsules", label: "Capsules" }
        ];
        break;

      case "oral-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "toothpaste", label: "Toothpaste" },
          { key: "mouthwash", label: "Mouthwash" }
        ];
        break;

      case "respiratory":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "inhalers", label: "Inhalers" }
        ];
        break;

      case "elderly-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "joint_support", label: "Joint Support" }
        ];
        break;

      case "women-health":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "menstrual_care", label: "Menstrual Care" }
        ];
        break;

      case "first-aid":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "bandages", label: "Bandages" }
        ];
        break;

      case "sexual_care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "condoms", label: "Condoms" },
          { key: "lubricants", label: "Lubricants" }
        ];
        break;

      case "covid-care":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "masks", label: "Masks" },
          { key: "sanitizers", label: "Sanitizers" }
        ];
        break;

      case "cold-immunity":
        tabList = [
          { key: "top_rated", label: "Top Rated" },
          { key: "recommendations", label: "Recommended" },
          { key: "tablets", label: "Tablets" },
          { key: "immunity_boosters", label: "Immunity Boosters" }
        ];
        break;

      default:
        tabList = [];
    }

    setActiveCategory("top_rated");

    // The "all" landing portal and invalid slugs don't fetch a category feed.
    if (categorySlug === "all" || !isValidCategory) {
      setJsonData(categorySlug === "all" ? { top_rated: [] } : {});
      setTabs([]);
      setLoading(false);
      return;
    }

    let active = true;
    setTabs(tabList);
    fetchCategoryProducts(categorySlug).then((data) => {
      if (!active) return;
      setJsonData(data || {});
      setLoading(false);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);

  /* -------------------------------------------------------
      LOAD PRODUCTS BASED ON ACTIVE TAB
  -------------------------------------------------------- */
  useEffect(() => {
    if (jsonData && jsonData[activeCategory]) {
      setProducts(jsonData[activeCategory]);
    } else {
      setProducts([]);
    }
  }, [jsonData, activeCategory]);

  /* -------------------------------------------------------
      INVALID CATEGORY PAGE
  -------------------------------------------------------- */
  if (!isValidCategory) {
    return (
      <div className="w-full p-10 text-center">
        <h2 className="text-2xl font-bold text-gray-500">No products available</h2>
        <p className="text-gray-400 mt-2">This category does not have any integrated JSON data.</p>
      </div>
    );
  }

  /* -------------------------------------------------------
      LOADING
  -------------------------------------------------------- */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center flex flex-col justify-center items-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orangeBrand border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading category products...</p>
      </div>
    );
  }

  /* -------------------------------------------------------
      MAIN RENDER
  -------------------------------------------------------- */
  if (categorySlug === "all") {
    const conditions = [
      { name: "Diabetes Care", slug: "diabetes-care", icon: Bloodtype, color: "bg-rose-50 text-rose-600 border-rose-100" },
      { name: "Cardiac Care", slug: "cardiac-care", icon: Favorite, color: "bg-red-50 text-red-600 border-red-100" },
      { name: "Stomach Care", slug: "stomach-care", icon: Medication, color: "bg-orange-50 text-orange-600 border-orange-100" },
      { name: "Pain Relief", slug: "pain-relief", icon: Healing, color: "bg-amber-50 text-amber-600 border-amber-100" },
      { name: "Liver Care", slug: "liver-care", icon: HealthAndSafety, color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
      { name: "Oral Care", slug: "oral-care", icon: AutoAwesome, color: "bg-blue-50 text-blue-600 border-blue-100" },
      { name: "Respiratory", slug: "respiratory", icon: Air, color: "bg-sky-50 text-sky-600 border-sky-100" },
      { name: "Sexual Health", slug: "sexual_care", icon: FavoriteBorder, color: "bg-pink-50 text-pink-600 border-pink-100" },
      { name: "Elderly Care", slug: "elderly-care", icon: Elderly, color: "bg-teal-50 text-teal-600 border-teal-100" },
      { name: "Cold & Immunity", slug: "cold-immunity", icon: Shield, color: "bg-emerald-50 text-emerald-600 border-emerald-100" },
    ];

    const labTests = [
      { name: "CBC Test (Complete Blood Count)", price: 299, originalPrice: 599, count: 30, desc: "A vital screen to evaluate overall health and detect infections/anemia." },
      { name: "HbA1c Test (Diabetic Check)", price: 499, originalPrice: 999, count: 3, desc: "Monitors average blood control over the past 3 months." },
      { name: "FBS (Fasting Blood Sugar)", price: 99, originalPrice: 199, count: 1, desc: "Measures blood glucose levels after fasting for accurate diagnosis." },
      { name: "Lipid Profile Test (Cholesterol)", price: 599, originalPrice: 1290, count: 8, desc: "Checks cholesterol levels to audit heart and circulatory health." },
    ];

    const brands = [
      { name: "Whisper", bg: "bg-pink-50 border-pink-100 text-pink-700" },
      { name: "Aveeno", bg: "bg-amber-50 border-amber-100 text-amber-700" },
      { name: "Volini", bg: "bg-blue-50 border-blue-100 text-blue-700" },
      { name: "Revital", bg: "bg-red-50 border-red-100 text-red-700" },
      { name: "MamyPoko", bg: "bg-indigo-50 border-indigo-100 text-indigo-700" },
      { name: "Fast&Up", bg: "bg-orange-50 border-orange-100 text-orange-700" },
      { name: "Himalaya", bg: "bg-emerald-50 border-emerald-100 text-emerald-700" },
      { name: "Zandu", bg: "bg-green-50 border-green-100 text-green-700" },
    ];

    return (
      <div className="w-full space-y-12 pb-16 px-1 lg:px-4">

        {/* 1. BROWSE BY HEALTH CONDITIONS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
              Browse by Health Conditions
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {conditions.map((c, i) => {
              const Icon = c.icon;
              return (
                <div
                  key={i}
                  onClick={() => navigate(`/home/${c.slug}`)}
                  className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-orangeBrand/30 hover:shadow-md cursor-pointer transition-all duration-200 select-none group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${c.color} group-hover:scale-105 transition`}>
                    <Icon fontSize="small" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 leading-tight group-hover:text-orangeBrand transition">
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. AD BANNER: SALT SWAP ALTERNATIVE */}
        <section className="animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-lg border border-slate-700/30">
            <div className="z-10 text-left">
              <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold font-mono">
                Just Launched
              </span>
              <h4 className="text-4xl md:text-3xl font-black mt-3 leading-tight max-w-sm">
                Explore Trusted Alternatives
              </h4>
              <p className="text-slate-300 text-xs mt-2 max-w-xs leading-relaxed">
                Same Active Salt Ingredients, Bigger Prescription Savings. Fully certified generics.
              </p>
            </div>
            <div className="flex items-center gap-4 mt-6 md:mt-0 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
              <div className="text-center select-none">
                <div className="text-[10px] text-orange-400 font-extrabold uppercase">Premium Branded</div>
                <div className="text-lg font-black text-white line-through mt-0.5">₹450</div>
              </div>
              <div className="text-lg text-white font-extrabold animate-pulse">➔</div>
              <div className="text-center select-none">
                <div className="text-[10px] text-green-400 font-extrabold uppercase"> Alternative</div>
                <div className="text-xl font-black text-green-400 mt-0.5">₹190</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. VALUE DEALS AT RS 100 / UNDER 150 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                Value Deals under ₹150
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily health items at pocket-friendly prices</p>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar scroll-smooth">
            {valueDeals.map((item) => (
              <div key={item.id} className="w-64 lg:w-72 flex-shrink-0">
                <ProductCard product={item} categorySlug={item.trueCategorySlug} />
              </div>
            ))}
          </div>
        </section>

        {/* 4. AD BANNER: SBI CREDIT CARD */}
        <section>
          <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-lg border border-teal-900/30">
            <div className="z-10 text-left">
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full uppercase tracking-wider font-extrabold font-mono">
                 Special card
              </span>
              <h2 className="text-2xl md:text-3xl font-black mt-3 leading-tight max-w-md">
                Save Up to 25% on Your <br />Medicine Spends
              </h2>
              <p className="text-slate-300 text-xs mt-2 max-w-sm leading-relaxed">
                With  Pharmacy SBI Card SELECT. Apply now and get flat ₹500 welcome health voucher.
              </p>
              <button 
                onClick={() => toast.success("SBI Card Application initiated! Check your registered email for details. 💳")}
                className="mt-5 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-full shadow-md transition active:scale-95"
              >
                Apply Now
              </button>
            </div>
            {/* Visa Card graphic */}
            <div className="w-56 h-36 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl shadow-2xl relative transform rotate-12 mt-6 md:mt-0 opacity-80 flex flex-col justify-between p-4 text-slate-900 select-none border border-amber-300/40">
              <div className="text-xs font-black tracking-widest uppercase"> Premium</div>
              <div className="text-sm font-mono tracking-widest mt-4">•••• •••• •••• 1234</div>
              <div className="flex justify-between items-end mt-2">
                <span className="text-[9px] uppercase font-bold">Health Care</span>
                <span className="text-xs font-black">VISA</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. MINIMUM 12% OFF DEALS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                High Discount Essentials
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Top products at unbeatable discounts</p>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar scroll-smooth">
            {discountDeals.map((item) => (
              <div key={item.id} className="w-64 lg:w-72 flex-shrink-0">
                <ProductCard product={item} categorySlug={item.trueCategorySlug} />
              </div>
            ))}
          </div>
        </section>

        {/* 6. HOT SELLERS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                Hot Sellers
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Most purchased wellness and medicines this week</p>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar scroll-smooth">
            {hotSellersDeals.map((item) => (
              <div key={item.id} className="w-64 lg:w-72 flex-shrink-0">
                <ProductCard product={item} categorySlug={item.trueCategorySlug} />
              </div>
            ))}
          </div>
        </section>

        {/* 7. AD BANNER: ASK ANYTHING ABOUT HEALTH */}
        <section>
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden shadow-lg border border-orange-500/30">
            <div className="z-10 text-left">
              <h2 className="text-2xl md:text-3xl font-black leading-tight max-w-md">
                Ask anything about your health.
              </h2>
              <p className="text-orange-50 text-xs mt-2 max-w-sm leading-relaxed">
                Get accurate, pharmacist-approved medical guidance and prescription substitutes within minutes.
              </p>
              <button 
                onClick={() => toast.info("Connecting to online medical advisor... Please stand by. 🩺")}
                className="mt-5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-full shadow-md transition active:scale-95"
              >
                Consult Pharmacist Online
              </button>
            </div>
            <div className="mt-6 md:mt-0 flex gap-3 z-10">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                <LocalHospital sx={{ fontSize: 20 }} />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                <MedicalServices sx={{ fontSize: 20 }} />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-md">
                <Medication sx={{ fontSize: 20 }} />
              </div>
            </div>
          </div>
        </section>

        {/* 8. POPULAR LAB TESTS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                Popular Lab Tests
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Professional diagnostics from home with free sample pickup</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {labTests.map((test, index) => (
              <div key={index} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex flex-col justify-between hover:shadow-md transition-all duration-300">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-4 border border-orange-200/50">
                    <ScienceOutlined fontSize="small" />
                  </div>
                  <h4 className="text-sm font-black text-slate-800 leading-snug">{test.name}</h4>
                  <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">{test.desc}</p>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold inline-block mt-3 select-none">
                    {test.count} Tests Included
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-black text-slate-900">₹{test.price}</span>
                      <span className="text-slate-400 line-through text-[11px] font-semibold">₹{test.originalPrice}</span>
                    </div>
                    <div className="text-[9px] text-green-600 font-extrabold uppercase mt-0.5">
                      Save {Math.round(((test.originalPrice - test.price) / test.originalPrice) * 100)}%
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      navigate("/book-test", { state: { test } });
                    }}
                    className="px-4 py-1.5 text-xs bg-black hover:bg-orangeBrand-light text-white font-extrabold rounded-full shadow-md transition active:scale-95 duration-200"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. ONETOUCH DIABETES MANAGEMENT */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                OneTouch Diabetes Management
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Special glucometers and testing strips</p>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar scroll-smooth">
            {diabetesDeals.map((item) => (
              <div key={item.id} className="w-64 lg:w-72 flex-shrink-0">
                <ProductCard product={item} categorySlug={item.trueCategorySlug} />
              </div>
            ))}
          </div>
        </section>

        {/* 10. BEST OF SKINCARE BY CERAVE / SKIN */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
                Best of Skincare
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Premium moisturizers, gels, and skin cleansers</p>
            </div>
          </div>
          <div className="flex overflow-x-auto gap-5 pb-4 no-scrollbar scroll-smooth">
            {skincareDeals.map((item) => (
              <div key={item.id} className="w-64 lg:w-72 flex-shrink-0">
                <ProductCard product={item} categorySlug={item.trueCategorySlug} />
              </div>
            ))}
          </div>
        </section>

        {/* 11. POPULAR BRANDS */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-black text-slate-800 tracking-tight">
              Popular Brands
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
            {brands.map((brand, i) => (
              <div
                key={i}
                onClick={() => navigate(`/searchresults?query=${encodeURIComponent(brand.name)}`)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shadow-[0_2px_8px_rgba(0,0,0,0.01)] ${brand.bg} font-black tracking-tight select-none`}
              >
                <div className="text-sm font-black truncate max-w-full">{brand.name}</div>
                <div className="text-[9px] uppercase tracking-wider opacity-70 mt-1">Shop Now</div>
              </div>
            ))}
          </div>
        </section>

        {/* 12. WHATSAPP TO ORDER */}
        <section className="pt-4">
          <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-100 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center shadow-sm select-none gap-4">
            <div className="text-left">
              <div className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                Convenient Ordering
              </div>
              <h3 className="text-lg md:text-xl font-black text-slate-800 mt-1">
                Order medicines directly via WhatsApp!
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Just send your doctor's prescription list to our official number for instant Hyderabad express delivery.
              </p>
            </div>
            <a 
              href="https://wa.me/919355247247" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md transition-all duration-200"
            >
              <WhatsApp fontSize="small" /> WhatsApp +91-9355247247
            </a>
          </div>
        </section>
      </div>
    );
  }

  /* -------------------------------------------------------
      MAIN RENDER (ORIGINAL TABS/PRODUCTS GRID FOR INDIVIDUAL CATEGORIES)
  -------------------------------------------------------- */
  return (

    <div className="w-full pt-0 px-4 pb-4">
      <div className="w-full mb-8 relative">
        <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">
          {displayName}
        </h2>
        <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full mt-2"></div>
      </div>
      {/* TABS NAVBAR */}
      <div className="w-full mb-2">
        <div className="overflow-x-auto whitespace-nowrap pb-4 border-b border-slate-100 flex gap-2.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              className={`px-4 py-2.5 text-xs font-extrabold rounded-full border transition active:scale-95 duration-150 shadow-sm ${
                activeCategory === tab.key
                  ? "bg-orangeBrand border-orangeBrand text-white hover:bg-orange-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-9 capitalize">
          {activeCategory.replaceAll("_", " ")}
        </h2>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              categorySlug={categorySlug}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
