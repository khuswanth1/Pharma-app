// src/components/Header/LocationSelector.jsx
import React, { useEffect, useState } from "react";
import { LocationOn, KeyboardArrowDown } from "@mui/icons-material";

import LiveLocationModal from "./LiveLocationModal";
import { getPrimaryAddress } from "../../utils/addressStorage";

export default function LocationSelector() {
  const [open, setOpen] = useState(false);
  const [primary, setPrimary] = useState(null);

  /* --------------------------------------------------------
     LOAD & AUTO-REFRESH PRIMARY ADDRESS
  -------------------------------------------------------- */
  useEffect(() => {
    const updatePrimary = () => setPrimary(getPrimaryAddress());

    updatePrimary();

    // Listen for any changes from SavedAddresses / AddAddressModal
    window.addEventListener("storage", updatePrimary);

    return () => window.removeEventListener("storage", updatePrimary);
  }, []);

  /* --------------------------------------------------------
     DISPLAY TEXT (Top UI)
  -------------------------------------------------------- */

  const displayTitle = primary ? primary.typeTag || "Other" : "Delivery Location";
  const displayAddress = primary
    ? primary.fullText || `${primary.flat || ""} ${primary.building || ""}`.trim().replace(/\s+/g, " ")
    : "Detect or Add Location";

  return (
    <>
      {/* OUTSIDE BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="
          flex items-center cursor-pointer
          px-2 py-2 rounded-xl border border-slate-100 bg-slate-50
          dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/80
          transition active:bg-gray-100 shadow-sm
          sm:px-3 sm:py-2
          lg:w-auto lg:border-none lg:bg-transparent lg:hover:bg-gray-50 lg:px-2 lg:py-1 lg:shadow-none
        "
      >
        {/* PIN ICON */}
        <LocationOn className="text-orange-600 flex-shrink-0" sx={{ fontSize: 20 }} />

        {/* TEXT BLOCK */}
        <div className="hidden sm:flex flex-col text-left ml-2 w-full lg:w-auto">
          <span className="text-[11px] text-gray-500 dark:text-slate-400 leading-tight">
            {displayTitle}
          </span>

          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px] md:max-w-[160px] lg:max-w-[220px]">
            {displayAddress}
          </span>
        </div>

        {/* DROPDOWN ICON */}
        <KeyboardArrowDown className="hidden sm:block ml-auto text-gray-600 dark:text-slate-400 lg:ml-1 flex-shrink-0" sx={{ fontSize: 18 }} />
      </button>

      {/* OPEN LOCATION MODAL */}
      {open && <LiveLocationModal onClose={() => setOpen(false)} />}
    </>
  );
}
