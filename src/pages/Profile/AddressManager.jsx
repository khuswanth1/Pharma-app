// src/pages/Profile/AddressManager.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Add, 
  Edit, 
  Delete, 
  Check, 
  Home, 
  Work, 
  LocationOn, 
  ArrowBack, 
  Search, 
  Info, 
  MyLocation 
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { useCart } from "../../context/CartContext";
import { 
  loadAddresses, 
  removeAddress, 
  setPrimaryAddress, 
  syncAddressesWithBackend 
} from "../../utils/addressStorage";
import AddAddressModal from "../../components/Header/AddAddressModal";

const getTypeIcon = (tag) => {
  switch (tag?.toLowerCase()) {
    case "home":
      return <Home className="text-orangeBrand flex-shrink-0" sx={{ fontSize: 20 }} />;
    case "work":
      return <Work className="text-orangeBrand flex-shrink-0" sx={{ fontSize: 20 }} />;
    default:
      return <LocationOn className="text-orangeBrand flex-shrink-0" sx={{ fontSize: 20 }} />;
  }
};

export default function AddressManager() {
  const navigate = useNavigate();
  const { setSelectedAddress } = useCart();
  const [list, setList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddr, setEditingAddr] = useState(null);

  /* --------------------------------------------------------
     LOAD & SORT ADDRESSES
  -------------------------------------------------------- */
  const refreshList = () => {
    const data = loadAddresses();
    // Sort so primary/default is first
    const sorted = [
      ...data.filter((a) => a.primary),
      ...data.filter((a) => !a.primary),
    ];
    setList(sorted);
  };

  useEffect(() => {
    refreshList();

    // Fetch from backend for logged in user to sync
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const u = JSON.parse(storedUser);
        if (u && u.id) {
          syncAddressesWithBackend(u.id).then(() => refreshList());
        }
      } catch (e) {
        console.error("Error parsing user context:", e);
      }
    }

    const handleStorageChange = () => refreshList();
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  /* --------------------------------------------------------
     SEARCH FILTERING
  -------------------------------------------------------- */
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return list;
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
     ACTIONS
  -------------------------------------------------------- */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      await removeAddress(id);
      refreshList();
      toast.success("Address deleted successfully.");
    }
  };

  const handleSetPrimary = async (addr) => {
    await setPrimaryAddress(addr.id);
    // Sync with CartContext immediately
    setSelectedAddress({
      id: addr.id,
      type: addr.typeTag || "Other",
      city: (addr.fullText || "").toLowerCase().includes("hyderabad") ? "Hyderabad" : "Other",
      details: addr.fullText || `${addr.flat || ""} ${addr.building || ""} ${addr.landmark || ""}`.trim()
    });
    window.dispatchEvent(new Event("storage"));
    refreshList();
    toast.success(`"${addr.typeTag || "Other"}" set as your default delivery address!`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 max-w-7xl mx-auto mt-20">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">MANAGE ADDRESSES</h1>
            <p className="text-gray-500 text-sm mt-1">Add, update, or select default delivery addresses.</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-orangeBrand hover:bg-orangeBrand-light text-white rounded-2xl text-xs font-black shadow-md hover:shadow-lg transition active:scale-95 duration-200"
        >
          <Add sx={{ fontSize: 18 }} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* FILTER & STATS BAR */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search Input */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-2xl w-full md:max-w-md focus-within:border-orangeBrand focus-within:ring-1 focus-within:ring-orangeBrand/20 transition-all">
          <Search className="text-slate-400" sx={{ fontSize: 18 }} />
          <input
            placeholder="Search saved addresses..."
            className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Info Banner */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 p-2.5 px-4 rounded-2xl text-[11px] font-bold text-amber-800">
          <Info sx={{ fontSize: 16 }} className="text-amber-600 flex-shrink-0" />
          <span>Service area validation: Deliveries are only validated for the Hyderabad region.</span>
        </div>
      </div>

      {/* ADDRESSES CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* DASHED ADD CARD */}
        <div
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-slate-200 hover:border-orangeBrand/50 bg-white/40 hover:bg-orange-50/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition duration-300 min-h-[220px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <Add sx={{ fontSize: 24 }} className="text-slate-400" />
          </div>
          <div>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Add New Address</span>
            <p className="text-[10px] text-slate-400 font-bold mt-1 max-w-[200px]">Save multiple addresses for home, work, or family delivery.</p>
          </div>
        </div>

        {/* LIST OF SAVED ADDRESSES */}
        {filteredList.map((addr) => {
          const isHyderabad = (addr.fullText || "").toLowerCase().includes("hyderabad");
          return (
            <div
              key={addr.id}
              className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between transition duration-200 min-h-[220px] relative overflow-hidden group
                ${addr.primary ? "border-orange-500 ring-2 ring-orange-50" : "border-slate-100 hover:border-slate-200"}
              `}
            >
              
              {/* TOP HEADER */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(addr.typeTag)}
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{addr.typeTag || "Other"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Primary Badge */}
                    {addr.primary && (
                      <span className="text-[9px] font-black text-orangeBrand bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Default
                      </span>
                    )}

                    {/* Hyderabad Validation Badge */}
                    {isHyderabad ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Valid Area
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Out of Area
                      </span>
                    )}
                  </div>
                </div>

                {/* ADDRESS CONTENT */}
                <p className="text-xs text-slate-500 font-bold leading-relaxed line-clamp-3 mb-4">
                  {addr.fullText || `${addr.flat || ""} ${addr.building || ""} ${addr.landmark || ""}`.trim()}
                </p>
              </div>

              {/* FOOTER & ACTIONS */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                
                {/* Receiver Info */}
                <div className="text-left min-w-0 pr-2">
                  <span className="text-[10px] font-black text-slate-700 block truncate uppercase">{addr.receiverName || "No Name"}</span>
                  <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{addr.phone || "No Phone"}</span>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  
                  {/* Default switch */}
                  {!addr.primary && (
                    <button
                      onClick={() => handleSetPrimary(addr)}
                      className="p-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orangeBrand hover:text-orange-700 border border-orange-100 transition active:scale-90 flex items-center justify-center"
                      title="Set as Default Address"
                    >
                      <Check sx={{ fontSize: 16 }} />
                    </button>
                  )}

                  {/* Edit */}
                  <button
                    onClick={() => setEditingAddr(addr)}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition active:scale-90 flex items-center justify-center"
                    title="Edit Address"
                  >
                    <Edit sx={{ fontSize: 16 }} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 border border-rose-100/60 transition active:scale-90 flex items-center justify-center"
                    title="Delete Address"
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* IF FILTERED LIST IS EMPTY */}
      {filteredList.length === 0 && list.length > 0 && (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm mt-6">
          <span className="text-3xl block mb-2">🔍</span>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">No matching addresses found.</p>
        </div>
      )}

      {/* MODALS */}
      {showAddModal && (
        <AddAddressModal
          editingAddress={null}
          onSaved={() => {
            setShowAddModal(false);
            refreshList();
            toast.success("Address added successfully!");
          }}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {editingAddr && (
        <AddAddressModal
          editingAddress={editingAddr}
          onSaved={() => {
            setEditingAddr(null);
            refreshList();
            toast.success("Address updated successfully!");
          }}
          onCancel={() => setEditingAddr(null)}
        />
      )}
    </div>
  );
}
