import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GridView, Close, Apps, ChildCare, Spa, Bloodtype, Favorite, Medication, Healing, HealthAndSafety, AutoAwesome, Air, FavoriteBorder, Elderly, Shield, Female, Masks, MedicalServices, Menu } from "@mui/icons-material";

const categories = [
  { id: 1, name: "All", icon: Apps },
  { id: 2, name: "Baby Care", icon: ChildCare },
  { id: 3, name: "Skin Care", icon: Spa },
  { id: 4, name: "Diabetes Care", icon: Bloodtype },
  { id: 5, name: "Cardiac Care", icon: Favorite },
  { id: 6, name: "Stomach Care", icon: Medication },
  { id: 7, name: "Pain Relief", icon: Healing },
  { id: 8, name: "Liver Care", icon: HealthAndSafety },
  { id: 9, name: "Oral Care", icon: AutoAwesome },
  { id: 10, name: "Respiratory", icon: Air },
  { id: 11, name: "Sexual Health", icon: FavoriteBorder },
  { id: 12, name: "Elderly Care", icon: Elderly },
  { id: 13, name: "Cold & Immunity", icon: Shield },
  { id: 14, name: "Women Health", icon: Female },
  { id: 15, name: "Covid Essentials", icon: Masks },
  { id: 16, name: "First Aid", icon: MedicalServices },
];

export default function CategorySlider() {
  const [active, setActive] = useState(1);
  const [open, setOpen] = useState(false); // Mobile drawer state
  const [collapsed, setCollapsed] = useState(false); // Collapsed icons-only state
  const navigate = useNavigate();
  const location = useLocation();

  // Sync active category state with route changes
  useEffect(() => {
    const segments = location.pathname.split("/");
    const slug = segments[segments.length - 1];
    if (slug) {
      const match = categories.find((c) => {
        const normName = c.name.toLowerCase().replace(/\s+/g, "-");
        if (normName === "covid-essentials" && slug === "covid-care") return true;
        if (normName === "sexual-health" && (slug === "sexual-care" || slug === "sexual_care")) return true;
        if (normName === "cold-&-immunity" && slug === "cold-immunity") return true;
        return normName === slug;
      });
      if (match) {
        setActive(match.id);
      }
    } else {
      setActive(1); // Default to "All"
    }
  }, [location]);

  const goToCategory = (cat) => {
    setActive(cat.id);
    const slug = cat.name.toLowerCase().replace(/\s+/g, "-");
    navigate(`/home/${slug}`);
    setOpen(false); // Close drawer on mobile
  };

  return (
    <>
      {/* MOBILE APP-STYLE FLOATING TRIGGER */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full z-50 flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 border border-orange-400 lg:hidden focus:outline-none"
        title="Browse Categories"
      >
        {open ? <Close className="w-6 h-6 animate-in fade-in spin-in duration-300" /> : <GridView className="w-6 h-6 animate-in fade-in duration-300" />}
      </button>

      {/* CORE Collapsible SIDEBAR */}
      <div
        className={`
          fixed left-0 top-[120px] lg:top-[90px] h-[calc(100vh-120px)] lg:h-[calc(100vh-90px)] 
          bg-white border-r border-gray-100 flex flex-col flex-shrink-0
          ${collapsed ? "w-20" : "w-64"}
          transform ${open ? "translate-x-0" : "-translate-x-full"}
          transition-all duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:flex
          z-40 shadow-[4px_0_15px_rgba(0,0,0,0.015)]
        `}
      >
        {/* SHOP BY CATEGORY / COLLAPSE MENU HEADER */}
        <div className={`px-4 py-4 border-b border-gray-50 flex-shrink-0 flex items-center justify-between ${collapsed ? "justify-center" : ""}`}>
          {!collapsed && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <GridView className="text-gray-400 w-4 h-4" />
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Explore Health
              </h2>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl hover:bg-slate-50 transition-all duration-200 focus:outline-none hidden lg:block hover:scale-105 active:scale-95"
            title={collapsed ? "Expand Sidebar" : "Collapse to Icons Only"}
          >
            <Menu
              className={`transition-transform duration-300 ${
                collapsed ? "text-gray-400" : "text-orange-500"
              }`}
              sx={{ fontSize: 22 }}
            />
          </button>
        </div>

        {/* SCROLLABLE CATEGORIES GRID LIST */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2 select-none no-scrollbar">
          {categories.map((cat) => {
            const isActive = active === cat.id;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => goToCategory(cat)}
                className={`group flex transition-all duration-200 ${
                  collapsed 
                    ? "flex-col items-center justify-center p-2 border-l-0 w-full" 
                    : "flex-row items-center px-3.5 py-2.5 border-l-4 gap-3.5 w-full"
                } ${
                  isActive
                    ? "bg-gradient-to-r from-orange-50/80 to-orange-100/20 border-orangeBrand text-orangeBrand font-black shadow-[sm_0_3px_6px_rgba(0,0,0,0.02)]"
                    : "border-transparent text-gray-600 hover:bg-slate-50 hover:text-gray-900 font-bold"
                }`}
                title={collapsed ? cat.name : ""}
              >
                {/* ICON CONTAINER */}
                <div className={`w-9 h-9 rounded-xl flex justify-center items-center p-1.5 transition-transform duration-300 group-hover:scale-105 flex-shrink-0 border shadow-sm ${
                  isActive 
                    ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-400" 
                    : "bg-orange-50/40 text-orange-600 border-orange-100"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {collapsed ? (
                  <span className="text-[9px] font-extrabold text-center mt-1.5 max-w-[72px] truncate leading-tight block animate-in fade-in duration-300">
                    {cat.name}
                  </span>
                ) : (
                  <span className="text-xs tracking-wide truncate animate-in fade-in duration-300">
                    {cat.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE BACKDROP OVERLAY OVER CLICKS */}
      {open && (
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-xs lg:hidden z-30 transition-opacity animate-in fade-in"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}