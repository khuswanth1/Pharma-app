import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LocalPharmacy } from "@mui/icons-material";

const LoadingQuotes = [
  "Preparing premium prescriptions...",
  "Auditing pharmaceutical safety codes...",
  "Securing 30-min express dispatch...",
  "Validating cold-chain safeguards...",
  "Checking Hyderabad service zones...",
  "Synchronizing health compliance layers...",
];

const PageLoader = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Randomize pharmacy-specific quote on route transition
    const randomQuote = LoadingQuotes[Math.floor(Math.random() * LoadingQuotes.length)];
    setQuote(randomQuote);

    // Show loading overlay
    setVisible(true);

    // Hide loader after a premium transition delay
    const timer = setTimeout(() => {
      setVisible(false);
    }, 750);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-white/85 backdrop-blur-md flex flex-col justify-center items-center z-[9999] animate-in fade-in duration-200">
      {/* Floating/Beating Medical Capsule Loader */}
      <div className="relative flex items-center justify-center">
        {/* Glowing pulse rings */}
        <div className="absolute w-24 h-24 rounded-full bg-orange-500/10 animate-ping duration-1000" />
        <div className="absolute w-16 h-16 rounded-full bg-orange-500/20 animate-pulse duration-700" />

        {/* Center Circular container */}
        <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-500/30 border border-orange-400/50 animate-bounce duration-1000">
          <LocalPharmacy className="text-white animate-pulse" sx={{ fontSize: 40 }} />
        </div>
      </div>

      {/* Brand & Loading Text */}
      <div className="mt-8 text-center px-4 max-w-sm select-none">
        <h2 className="text-lg font-black text-slate-800 tracking-tight">
          Pharmacy
        </h2>
        <p className="text-[10px] text-orange-600 font-extrabold tracking-widest uppercase mt-1 animate-pulse">
          Loading Health Catalog
        </p>
        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-2.5 italic">
          "{quote}"
        </p>
      </div>

    </div>
  );
};

export default PageLoader;
