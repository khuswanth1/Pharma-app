import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Cancel, ArrowBack, Refresh, ShoppingCart } from "@mui/icons-material";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to checkout if the page is reloaded
  React.useEffect(() => {
    const navigationEntries = performance.getEntriesByType("navigation");
    if (navigationEntries.length > 0 && navigationEntries[0].type === "reload") {
      navigate("/checkout");
    }
  }, [navigate]);
  
  // Extract custom parameters passed during navigation redirect
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId") || "";
  const errorMessage = queryParams.get("reason") || "The payment transaction was cancelled or declined by the bank.";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-xl p-8 text-center space-y-6">
        
        {/* Error Icon */}
        <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-full flex justify-center items-center text-rose-500 mx-auto shadow-inner">
          <Cancel sx={{ fontSize: 44 }} />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-xl font-black text-slate-800 tracking-wide uppercase">Payment Failed</h1>
          <p className="text-xs text-slate-400 font-semibold leading-relaxed">
            We couldn't process your payment transaction. Your bank details or session might have timed out.
          </p>
        </div>

        {/* Details card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2.5 text-left leading-normal">
          {orderId && (
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase tracking-wide">Order ID</span>
              <span className="text-slate-700 font-extrabold font-mono select-all">{orderId}</span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="font-bold text-slate-400 uppercase tracking-wide">Error Reason</span>
            <span className="text-rose-700 font-extrabold">{errorMessage}</span>
          </div>
        </div>

        {/* Recovery Options */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate("/checkout")}
            className="flex-1 py-3 px-4 bg-orangeBrand hover:bg-orangeBrand-light text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 duration-150 flex items-center justify-center gap-1.5 uppercase"
          >
            <Refresh sx={{ fontSize: 14 }} />
            <span>Try Checkout Again</span>
          </button>
          
          <button
            onClick={() => navigate("/cart")}
            className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs rounded-xl shadow-sm transition active:scale-95 duration-150 flex items-center justify-center gap-1.5 uppercase"
          >
            <ShoppingCart sx={{ fontSize: 14 }} />
            <span>View Cart</span>
          </button>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="text-xs font-black text-slate-400 hover:text-slate-600 transition inline-flex items-center gap-1 uppercase tracking-wider"
        >
          <ArrowBack sx={{ fontSize: 13 }} />
          <span>Return to Shop</span>
        </button>

      </div>
    </div>
  );
};

export default PaymentFailed;
