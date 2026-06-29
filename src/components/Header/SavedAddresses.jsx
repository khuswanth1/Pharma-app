// src/components/Header/SavedAddresses.jsx
import React, { useEffect, useState } from "react";
import {
  loadAddresses,
  removeAddress,
  setPrimaryAddress,
  syncAddressesWithBackend,
} from "../../utils/addressStorage";
import { Edit, Delete, Check, Home, Work, LocationOn } from "@mui/icons-material";

const getTypeIcon = (tag) => {
  switch (tag?.toLowerCase()) {
    case "home":
      return <Home sx={{ fontSize: 16 }} className="text-slate-500 flex-shrink-0" />;
    case "work":
      return <Work sx={{ fontSize: 16 }} className="text-slate-500 flex-shrink-0" />;
    default:
      return <LocationOn sx={{ fontSize: 16 }} className="text-slate-500 flex-shrink-0" />;
  }
};

export default function SavedAddresses({ searchQuery = "", onSelect, onEdit, onClose }) {
  const [list, setList] = useState([]);

  /* --------------------------------------------------------
     REACTIVE SEARCH FILTERING
     -------------------------------------------------------- */
  const filteredList = React.useMemo(() => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((a) => {
      const tag = (a.typeTag || "").toLowerCase();
      const full = (a.fullText || "").toLowerCase();
      const flat = (a.flat || "").toLowerCase();
      const bld = (a.building || "").toLowerCase();
      const lnd = (a.landmark || "").toLowerCase();
      const rcv = (a.receiverName || "").toLowerCase();
      const ph = (a.phone || "").toLowerCase();
      return (
        tag.includes(q) ||
        full.includes(q) ||
        flat.includes(q) ||
        bld.includes(q) ||
        lnd.includes(q) ||
        rcv.includes(q) ||
        ph.includes(q)
      );
    });
  }, [list, searchQuery]);

  /* --------------------------------------------------------
     LOAD + SORT (Primary First)
  -------------------------------------------------------- */
  const refreshList = () => {
    const data = loadAddresses();

    const sorted = [
      ...data.filter((a) => a.primary),
      ...data.filter((a) => !a.primary),
    ];

    setList(sorted);
  };

  /* --------------------------------------------------------
     INITIAL + LIVE REFRESH
  -------------------------------------------------------- */
  useEffect(() => {
    refreshList();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u && u.id) {
          syncAddressesWithBackend(u.id).then(() => refreshList());
        }
      } catch (e) {
        console.error(e);
      }
    }

    const reSync = () => refreshList();
    window.addEventListener("storage", reSync);

    return () => window.removeEventListener("storage", reSync);
  }, []);

  /* --------------------------------------------------------
     DELETE — Instant delete
  -------------------------------------------------------- */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this saved address?")) {
      await removeAddress(id);
      refreshList();
    }
  };

  /* --------------------------------------------------------
     USE — Set Primary + Update UI + Close Modal
  -------------------------------------------------------- */
  const handleUse = async (addr) => {
    // 1️⃣ Make selected address PRIMARY
    await setPrimaryAddress(addr.id);

    // 2️⃣ Update UI everywhere
    window.dispatchEvent(new Event("storage"));

    // 3️⃣ Notify parent (LiveLocationModal)
    if (onSelect) onSelect(addr);

    // 4️⃣ Close modal
    if (onClose) onClose();

    // 5️⃣ Refresh list so primary moves to top
    refreshList();
  };

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">Saved Addresses</h4>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="text-xs font-bold text-slate-400">No saved addresses.</div>
        ) : filteredList.length === 0 ? (
          <div className="text-xs font-bold text-slate-400">No matching addresses found.</div>
        ) : null}

        {filteredList.map((a) => (
          <div
            key={a.id}
            className={`p-3 rounded-xl border bg-white flex justify-between items-start shadow-sm transition
              ${a.primary ? "border-orange-500 bg-orange-50" : "border-gray-200"}
            `}
          >
            {/* LEFT SECTION */}
            <div className="w-[70%]">
              <div className="flex items-center gap-2">
                {getTypeIcon(a.typeTag)}
                <div className="text-sm font-medium">{a.typeTag || "Other"}</div>

                {/* PRIMARY BADGE */}
                {a.primary && (
                  <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full flex items-center gap-0.5 border border-orange-100 uppercase tracking-wider">
                    <Check sx={{ fontSize: 11 }} /> Primary
                  </span>
                )}
              </div>

              <div className="text-xs text-gray-500 max-w-xs mt-1">
                {a.fullText ||
                  `${a.flat || ""} ${a.building || ""} ${a.landmark || ""}`.trim()}
              </div>

              <div className="text-xs text-gray-400 mt-1">
                {a.receiverName} · {a.phone}
              </div>
            </div>

            {/* RIGHT BUTTON GROUP */}
            <div className="flex items-center gap-2 self-center">

              {/* USE BUTTON (hide for primary) */}
              {!a.primary && (
                <button
                  className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 hover:text-orange-700 border border-orange-100 transition active:scale-95 flex items-center justify-center shadow-sm"
                  title="Use Address"
                  onClick={() => handleUse(a)}
                >
                  <Check sx={{ fontSize: 16 }} />
                </button>
              )}

              {/* EDIT */}
              <button
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 border border-slate-200 transition active:scale-95 flex items-center justify-center shadow-sm"
                title="Edit Address"
                onClick={() => onEdit && onEdit(a)}
              >
                <Edit sx={{ fontSize: 16 }} />
              </button>

              {/* DELETE */}
              <button
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-700 border border-red-100 transition active:scale-95 flex items-center justify-center shadow-sm"
                title="Delete Address"
                onClick={() => handleDelete(a.id)}
              >
                <Delete sx={{ fontSize: 16 }} />
              </button>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
