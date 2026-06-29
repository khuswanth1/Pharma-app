import React, { useState } from "react";
import { FiTrash2, FiClock, FiPlus, FiMinus, FiEdit2 } from "react-icons/fi";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { toast } from "react-toastify";

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart, updateItemNotes, toggleSubscription, isRxRequired } = useCart();
  const { addToWishlist } = useWishlist();
  
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notesText, setNotesText] = useState(item.notes || "");

  const price = Math.round(item.final_price);
  const cost = Math.round(item.cost || item.final_price);
  const isDiscounted = cost > price;

  const isRegulated = isRxRequired(item);

  const handleNotesSubmit = (e) => {
    e.preventDefault();
    updateItemNotes(item.id, notesText);
    setShowNotesInput(false);
    toast.success(`Notes updated for ${item.name}! `);
  };

  const handleSaveForLater = () => {
    addToWishlist(item, "My Medicines");
    removeFromCart(item.id);
    toast.success(`Moved ${item.name} to Wishlist (Save For Later)`);
  };

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 relative">
      <div className="flex gap-4">
        {/* IMAGE */}
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex justify-center items-center p-2 flex-shrink-0">
          <img
            src={Array.isArray(item.images) ? item.images[0] : item.images}
            alt={item.name}
            className="h-full object-contain"
          />
        </div>

        {/* DETAILS */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</h4>
              <button
                onClick={() => {
                  removeFromCart(item.id);
                  toast.info(`${item.name} removed from Cart`);
                }}
                className="text-gray-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 font-semibold uppercase mt-0.5">
              {item.manufacturer || item.brand || "Generics"}
            </p>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* PRICING */}
            <div className="flex items-baseline gap-2">
              <span className="text-base font-black text-gray-900">₹{price}</span>
              {isDiscounted && (
                <span className="text-gray-400 line-through text-xs font-semibold">₹{cost}</span>
              )}
            </div>

            {/* QUANTITY CONTROL */}
            <div className="flex items-center gap-2 border border-orangeBrand px-2 py-0.5 rounded-full bg-orange-50/20">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="text-orangeBrand font-black hover:scale-125 transition-all text-xs"
              >
                <FiMinus className="w-3 h-3" />
              </button>
              <span className="font-extrabold text-xs text-gray-800 w-4 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="text-orangeBrand font-black hover:scale-125 transition-all text-xs"
              >
                <FiPlus className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIONS - Notes, Save For Later, Subscriptions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-50 text-xs">
        {/* Prescription Regulated Limit */}
        {isRegulated && (
          <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-bold">
            Required (Max Qty: 10)
          </span>
        )}

        <div className="flex items-center gap-3">
          {/* Notes toggle button */}
          <button
            onClick={() => setShowNotesInput(!showNotesInput)}
            className="flex items-center gap-1 text-gray-500 hover:text-orangeBrand transition font-medium"
          >
            <FiEdit2 className="w-3 h-3" />
            <span>{item.notes ? "Edit Note" : "Add Note"}</span>
          </button>

          {/* Save For Later */}
          <button
            onClick={handleSaveForLater}
            className="text-gray-500 hover:text-orangeBrand transition font-medium"
          >
            Save For Later
          </button>
        </div>

        {/* Monthly Subscription toggle */}
        <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 border px-3 py-1 rounded-full transition">
          <input
            type="checkbox"
            checked={!!item.isSubscription}
            onChange={() => {
              toggleSubscription(item.id);
              toast.success(
                item.isSubscription
                  ? `Cancelled subscription for ${item.name}`
                  : `Subscribed ${item.name} for Monthly Deliveries!`
              );
            }}
            className="rounded text-orangeBrand focus:ring-orangeBrand w-3 h-3 cursor-pointer"
          />
          <span className="text-[10px] text-slate-700 font-extrabold flex items-center gap-1 uppercase tracking-wider">
            <FiClock className="w-3 h-3 text-slate-500" />
            Deliver Monthly
          </span>
        </label>
      </div>

      {/* Notes Form expansion */}
      {showNotesInput && (
        <form onSubmit={handleNotesSubmit} className="mt-2 flex gap-2 w-full animate-in slide-in-from-top-2">
          <input
            type="text"
            placeholder="e.g. Need sugar-free medicine, or morning dose instructions..."
            value={notesText}
            onChange={(e) => setNotesText(e.target.value)}
            className="flex-1 px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-orangeBrand"
          />
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-orangeBrand hover:bg-orangeBrand-light text-white font-bold rounded-xl text-xs transition"
          >
            Save
          </button>
        </form>
      )}

      {/* Saved Notes Display */}
      {item.notes && !showNotesInput && (
        <div className="bg-orange-50/40 border border-orange-100/60 rounded-xl p-2.5 text-[11px] text-orange-800 font-medium">
          <span className="font-semibold">Note:</span> "{item.notes}"
        </div>
      )}
    </div>
  );
};

export default CartItem;
