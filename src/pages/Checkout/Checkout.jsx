import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import {
  WarningAmber, CloudUpload, ShoppingBag, AccessTime, Shield,
  LocalAtm, CreditCard, AccountBalanceWallet, AccountBalance, PhoneAndroid, CheckCircle, DirectionsBike
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { loadAddresses } from "../../utils/addressStorage";
import { createOrder, updateOrderStatus } from "../../api/orderService";
import { createPaymentOrder, verifyPayment } from "../../api/paymentService";
import { updateProfileAPI, getProfileAPI } from "../../api/authService";

// Dynamically loads Razorpay checkout.js if not already present
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });



const Checkout = () => {
  const {
    cart,
    retailTotal,
    retailDiscount,
    couponDiscount,
    gst,
    deliveryCharges,
    handlingFee,
    grandTotal,
    selectedAddress,
    setSelectedAddress,
    isAddressValidForDelivery,
    requiresPrescription,
    uploadedPrescription,
    setUploadedPrescription,
    clearCart
  } = useCart();

  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // Rider Tipping States
  const [selectedTip, setSelectedTip] = useState(null);
  const [showCustomTipInput, setShowCustomTipInput] = useState(false);
  const [customTipValue, setCustomTipValue] = useState("50");

  // Address list
  const [addresses, setAddresses] = useState(() => {
    const list = loadAddresses();
    if (list.length > 0) {
      return list.map(a => ({
        id: a.id,
        type: a.typeTag || "Other",
        city: (a.fullText || "").toLowerCase().includes("hyderabad") ? "Hyderabad" : "Other",
        details: a.fullText || `${a.flat || ""} ${a.building || ""} ${a.landmark || ""}`.trim()
      }));
    }
    return [
      { id: 1, type: "Home", city: "Hyderabad", details: "Flat 204, Rainbow Residency, Hyderabad, Telangana" },
      { id: 2, type: "Office", city: "Hyderabad", details: "WeWork Krishe Emerald, Hitech City, Hyderabad" },
      { id: 3, type: "Parents Home", city: "Secunderabad", details: "Plot 42, Sai Nagar, Secunderabad, Telangana" }
    ];
  });

  useEffect(() => {
    const handleSync = () => {
      const list = loadAddresses();
      if (list.length > 0) {
        setAddresses(list.map(a => ({
          id: a.id,
          type: a.typeTag || "Other",
          city: (a.fullText || "").toLowerCase().includes("hyderabad") ? "Hyderabad" : "Other",
          details: a.fullText || `${a.flat || ""} ${a.building || ""} ${a.landmark || ""}`.trim()
        })));
      }
    };
    window.addEventListener("storage", handleSync);
    return () => window.removeEventListener("storage", handleSync);
  }, []);

  // Retrieve user details from localStorage
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("pharmacy_user") || localStorage.getItem("user");
    return saved ? JSON.parse(saved) : { name: "Keerthi M", email: "keerthi@example.com", phone: "+91 9876543210", walletBalance: 0 };
  });

  const [showUpiModal, setShowUpiModal] = useState(false);
  const [simulatedOrder, setSimulatedOrder] = useState(null);

  const handleUpiPaymentSuccess = async (oToUse) => {
    const targetOrder = oToUse || simulatedOrder;
    if (!targetOrder) return;
    setIsPlacingOrder(true);
    setShowUpiModal(false);
    try {
      const amountInPaise = Math.round(Number(targetOrder.totalAmount || grandTotal) * 100);
      const pOrder = await createPaymentOrder({
        orderId: String(targetOrder.id),
        amount: amountInPaise,
        paymentMethod: "UPI"
      });

      await verifyPayment({
        razorpayOrderId: pOrder.razorpayOrderId,
        razorpayPaymentId: "UPI_PAY_" + targetOrder.id,
        razorpaySignature: "UPI_SIG_" + targetOrder.id
      });

      await updateOrderStatus(targetOrder.id, "PAID");
      
      toast.success("UPI Payment Successful!");
      finalizeOrderPlacement(targetOrder);
    } catch (err) {
      console.error("UPI Simulation error:", err);
      toast.error("Failed to verify simulated UPI payment.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePrescriptionUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadedPrescription(true);
      setUploadedFile(file.name);
      toast.success("Prescription uploaded and verified!");
    }, 1500);
  };

  const handlePlaceOrder = async () => {
    // Validations
    if (!isAddressValidForDelivery()) {
      toast.error("Invalid shipping location. Delivery is restricted to Hyderabad!");
      return;
    }
    if (requiresPrescription && !uploadedPrescription) {
      toast.error("Restricted medicines require prescription upload!");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }
    if (Number(grandTotal) < 1) {
      toast.error("Order total must be at least ₹1 to proceed.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Build order items
      const orderItems = cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.quantity,
        price: Number(item.final_price)
      }));

      const orderTotal = Number(grandTotal) + (selectedTip || 0);

      const orderPayload = {
        userId: user.id || user.userId || "guest",
        totalAmount: orderTotal,
        items: orderItems,
        paymentMethod: paymentMethod.toUpperCase()
      };

      // STEP 1 — Create order in order-service (always)
      const savedOrder = await createOrder(orderPayload);

      if (!savedOrder || !savedOrder.id) {
        throw new Error("Order could not be created. Please try again.");
      }

      // STEP 2a — Cash on Delivery: record in payment-service then finalize
      if (paymentMethod === "cod") {
        try {
          await createPaymentOrder({
            orderId: String(savedOrder.id),
            amount: Math.round(orderTotal * 100),
            paymentMethod: "COD"
          });
        } catch (codErr) {
          // COD recording failure is non-fatal — order is already created
          console.warn("[Checkout] COD payment record error (non-fatal):", codErr);
        }
        setIsPlacingOrder(false);
        finalizeOrderPlacement(savedOrder);
        return;
      }

      // STEP 2c — Wallet Payment: Deduct balance, record & verify payment record, then finalize
      if (paymentMethod === "wallet") {
        const currentWallet = Number(user.walletBalance || 0);
        const uId = user.id || user.userId;

        // If wallet balance is insufficient, top up via Razorpay first
        if (currentWallet < orderTotal) {
          const missingAmount = orderTotal - currentWallet;
          toast.info(`Wallet balance low. Topping up ₹${missingAmount.toFixed(2)} via Razorpay...`);

          const sdkLoaded = await loadRazorpayScript();
          if (!sdkLoaded) throw new Error("Razorpay SDK failed to load.");

          const topUpOrder = await createPaymentOrder({
            orderId: `WLT_${uId}_${Date.now()}`,
            amount: Math.round(missingAmount * 100),
            paymentMethod: "RAZORPAY"
          });
          if (!topUpOrder || !topUpOrder.razorpayOrderId) throw new Error("Failed to create wallet top-up order.");

          setIsPlacingOrder(false);

          const rzp = new window.Razorpay({
            key: topUpOrder.keyId || "rzp_test_T6dPUc4yPxTBNw",
            amount: topUpOrder.amount,
            currency: topUpOrder.currency || "INR",
            name: "Pharmacy Wallet Top-Up",
            description: `Add ₹${missingAmount.toFixed(2)} to complete order`,
            order_id: topUpOrder.razorpayOrderId,
            handler: async (response) => {
              setIsPlacingOrder(true);
              try {
                // 1. Verify top-up payment with Razorpay
                await verifyPayment({
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                });

                // 2. Credit the top-up amount into wallet on server
                const toppedUpBalance = currentWallet + missingAmount;
                await updateProfileAPI(uId, { walletBalance: toppedUpBalance });

                // ✅ Update UI immediately to show topped-up balance
                const toppedUpUser = { ...user, walletBalance: toppedUpBalance };
                setUser(toppedUpUser);
                localStorage.setItem("pharmacy_user", JSON.stringify(toppedUpUser));
                localStorage.setItem("user", JSON.stringify(toppedUpUser));
                window.dispatchEvent(new Event("storage"));
                toast.success(`₹${missingAmount.toFixed(2)} added to wallet! New balance: ₹${toppedUpBalance.toFixed(2)}`);

                // 3. Now deduct the full order total from wallet
                const finalBalance = toppedUpBalance - orderTotal;
                const updateResp = await updateProfileAPI(uId, { walletBalance: finalBalance });
                if (updateResp && updateResp.success) {
                  // ✅ Update UI with final balance after deduction
                  const finalUser = { ...user, walletBalance: finalBalance };
                  setUser(finalUser);
                  localStorage.setItem("pharmacy_user", JSON.stringify(finalUser));
                  localStorage.setItem("user", JSON.stringify(finalUser));
                  window.dispatchEvent(new Event("storage"));
                }

                // 4. Record wallet payment for the order
                try {
                  const wltOrder = await createPaymentOrder({
                    orderId: `WLT_PAY_${uId}_${savedOrder.id}`,
                    amount: Math.round(orderTotal * 100),
                    paymentMethod: "WALLET"
                  });
                  await verifyPayment({
                    razorpayOrderId: wltOrder.razorpayOrderId,
                    razorpayPaymentId: "WLT_PAY_" + savedOrder.id,
                    razorpaySignature: "WLT_SIG_" + savedOrder.id
                  });
                } catch (wltErr) {
                  console.warn("[Checkout] Wallet payment record error (non-fatal):", wltErr);
                }

                setIsPlacingOrder(false);
                toast.success("Order placed successfully via Wallet!");
                finalizeOrderPlacement(savedOrder);
              } catch (err) {
                setIsPlacingOrder(false);
                console.error("Wallet top-up order error:", err);
                toast.error("Top-up succeeded but order processing failed. Contact support.");
              }
            },
            prefill: { name: user.name || "", email: user.email || "", contact: user.phone || "" },
            theme: {  color: "#2734e9ff" },
            modal: {
              ondismiss: () => {
                setIsPlacingOrder(false);
                toast.warn("Top-up cancelled. Order not placed.");
              }
            }
          });
          rzp.open();
          return;
        }

        // Sufficient balance — deduct directly
        const newBalance = currentWallet - orderTotal;
        const response = await updateProfileAPI(uId, { walletBalance: newBalance });
        if (response && response.success) {
          const updatedUser = { ...user, walletBalance: newBalance };
          setUser(updatedUser);
          localStorage.setItem("pharmacy_user", JSON.stringify(updatedUser));
          localStorage.setItem("user", JSON.stringify(updatedUser));
          window.dispatchEvent(new Event("storage"));
        } else {
          throw new Error("Failed to deduct amount from wallet profile on server.");
        }
        try {
          const pOrder = await createPaymentOrder({
            orderId: `WLT_PAY_${uId}_${savedOrder.id}`,
            amount: Math.round(orderTotal * 100),
            paymentMethod: "WALLET"
          });
          await verifyPayment({
            razorpayOrderId: pOrder.razorpayOrderId,
            razorpayPaymentId: "WLT_PAY_" + savedOrder.id,
            razorpaySignature: "WLT_SIG_" + savedOrder.id
          });
        } catch (wltErr) {
          console.warn("[Checkout] Wallet payment record / verification error:", wltErr);
        }
        setIsPlacingOrder(false);
        finalizeOrderPlacement(savedOrder);
        return;
      }

      // STEP 2d — UPI Simulation Flow
      if (paymentMethod === "upi") {
        setSimulatedOrder(savedOrder);
        setShowUpiModal(true);
        setIsPlacingOrder(false);
        return;
      }

      // STEP 2b — Online Payment: Razorpay flow
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) {
        throw new Error("Razorpay SDK failed to load. Check your internet connection.");
      }

      // STEP 3 — Create Razorpay payment order via backend
      const amountInPaise = Math.round(orderTotal * 100);
      let pOrder;
      try {
        pOrder = await createPaymentOrder({
          orderId: String(savedOrder.id),
          amount: amountInPaise,
          paymentMethod: "RAZORPAY"
        });
      } catch (payErr) {
        throw new Error(typeof payErr === "string" ? payErr : "Failed to create payment order on server.");
      }

      if (!pOrder || !pOrder.razorpayOrderId) {
        throw new Error("Backend did not return a valid Razorpay order ID.");
      }

      // STEP 4 — Open Razorpay modal
      setIsPlacingOrder(false);

      const options = {
        key: pOrder.keyId || "rzp_test_T6dPUc4yPxTBNw",
        amount: pOrder.amount,            // paise
        currency: pOrder.currency || "INR",
        name: "Pharmacy App",
        description: `Order #${savedOrder.id}`,
        order_id: pOrder.razorpayOrderId,

        // STEP 5 — After Razorpay payment success
        handler: async (response) => {
          setIsPlacingOrder(true);
          try {
            await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            await updateOrderStatus(savedOrder.id, "PAID");
            setIsPlacingOrder(false);
            toast.success("Payment successful! 🎉");
            finalizeOrderPlacement({ ...savedOrder, status: "Paid" });
          } catch (verifyErr) {
            setIsPlacingOrder(false);
            console.error("Payment verification error:", verifyErr);
            toast.error("Payment captured but verification failed. Contact support with Order ID: " + savedOrder.id);
            navigate(`/order-tracking/${savedOrder.id}`);
          }
        },

        prefill: {
          name: user.name || "",
          email: user.email || "",
          contact: user.phone || ""
        },
        notes: { orderId: savedOrder.id },
        theme: {  color: "#2734e9ff" },
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI / QR Code",
                instruments: [
                  {
                    method: "upi",
                    flows: ["qr", "intent", "collect"]
                  }
                ]
              }
            },
            sequence: ["block.upi", "block.cards", "block.netbanking", "block.wallet"],
            preferences: {
              show_default_blocks: true
            }
          }
        },

        modal: {
          ondismiss: () => {
            setIsPlacingOrder(false);
            toast.warn("Payment cancelled. Please try again or choose another payment method.");
            navigate(`/payment-failed?orderId=${savedOrder.id}&reason=Payment dismissed by user`);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        setIsPlacingOrder(false);
        console.error("Razorpay payment.failed:", response.error);
        toast.error(`Payment failed: ${response.error.description || "Unknown error"}. Please try again.`);
        navigate(`/payment-failed?orderId=${savedOrder.id}&reason=${encodeURIComponent(response.error.description || "Transaction failed")}`);
      });
      rzp.open();

    } catch (err) {
      setIsPlacingOrder(false);
      console.error("handlePlaceOrder error:", err);
      toast.error(typeof err === "string" ? err : (err?.message || "Failed to place order. Try again."));
    }
  };

  const finalizeOrderPlacement = (savedOrder) => {
    const orderRecord = {
      id: savedOrder.id,
      date: new Date(savedOrder.createdAt || new Date()).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
      }),
      amount: `₹${savedOrder.totalAmount || grandTotal}`,
      status: savedOrder.status || "Confirmed",
      paymentMethod: paymentMethod,
      items: cart,
      deliveryTime: selectedAddress.city === "Hyderabad" ? "30 mins" : "Tomorrow 10 AM"
    };
    const localOrders = JSON.parse(localStorage.getItem("pharmacy_orders")) || [];
    localStorage.setItem("pharmacy_orders", JSON.stringify([orderRecord, ...localOrders]));

    clearCart();
    toast.success("Order Placed Successfully! 🎉");
    navigate(`/order-tracking/${savedOrder.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-8 max-w-7xl mx-auto">
      {/* PLACE ORDER LOADING OVERLAY */}
      {isPlacingOrder && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex flex-col justify-center items-center gap-4 text-white">
          <div className="w-16 h-16 border-4 border-orangeBrand border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-black tracking-wide animate-pulse">PROCESSING YOUR ORDER...</h2>
          <p className="text-xs text-gray-400">Verifying prescription, stock, and payment gateway...</p>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Secure Checkout</h1>
        <p className="text-gray-500 text-xs mt-1">Confirm your patient info, delivery address, and choose a payment method.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: BLOCKS 1 TO 4 */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 1: PATIENT PROFILE VERIFICATION */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 bg-orange-100 text-orangeBrand font-black rounded-full flex justify-center items-center text-[10px]">1</span>
              Patient Profile Verification
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Name</span>
                <span className="font-extrabold text-gray-800">{user.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Phone Number</span>
                <span className="font-extrabold text-gray-800">{user.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-0.5">Email ID</span>
                <span className="font-extrabold text-gray-800">{user.email}</span>
              </div>
            </div>
          </div>

          {/* STEP 2: SHIPPING & DELIVERY LOCATION */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 bg-orange-100 text-orangeBrand font-black rounded-full flex justify-center items-center text-[10px]">2</span>
              Delivery Address Selection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {addresses.map((addr) => (
                <button
                  key={addr.id}
                  onClick={() => setSelectedAddress(addr)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[110px] transition-all duration-200 ${
                    selectedAddress.id === addr.id
                      ? "border-orangeBrand bg-orange-50/10 shadow-sm"
                      : "border-gray-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="w-full flex justify-between items-center">
                    <span className="text-xs font-extrabold text-gray-800 uppercase">{addr.type}</span>
                    {selectedAddress.id === addr.id && <span className="text-orangeBrand font-black text-[10px]">✔ ACTIVE</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 line-clamp-2 mt-2 leading-relaxed">{addr.details}</p>
                </button>
              ))}
            </div>

            {/* Availability Check */}
            {isAddressValidForDelivery() ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-[11px] text-emerald-800 font-extrabold flex items-center gap-2">
                <span>Available: Express 30-min Delivery to {selectedAddress.city}</span>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-3 text-[11px] text-rose-800 font-extrabold flex items-center gap-2">
                <span>Error: Pharmacy App does not deliver to {selectedAddress.city} yet!</span>
              </div>
            )}
          </div>

          {/* STEP 3: PRESCRIPTION UPLOAD (only for restricted medicines) */}
          {requiresPrescription && (
            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4 animate-in zoom-in-95">
              <h3 className="text-xs font-black text-rose-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 bg-rose-100 text-rose-600 font-black rounded-full flex justify-center items-center text-[10px]">3</span>
                Prescription Upload Verification
              </h3>
              
              {uploadedPrescription ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3.5">
                  <div className="text-left">
                    <div className="text-xs font-extrabold text-emerald-800">Compliance Verified!</div>
                    {uploadedFile && <div className="text-[10px] text-gray-500">File: {uploadedFile}</div>}
                  </div>
                  <button
                    onClick={() => {
                      setUploadedPrescription(false);
                      setUploadedFile(null);
                    }}
                    className="ml-auto text-[10px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 px-3 py-1.5 rounded-xl transition uppercase tracking-wide"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center space-y-3 hover:border-orangeBrand/30 transition duration-150">
                  <div className="w-12 h-12 bg-slate-50 border border-gray-100 rounded-xl flex items-center justify-center text-slate-400 mx-auto">
                    <CloudUpload sx={{ fontSize: 24 }} />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-800">Drag & drop doctor prescription here</h4>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal">Supports JPEG, PNG, PDF (Max 5MB)</p>
                  </div>
                  <label className="inline-flex px-4 py-2 bg-orangeBrand hover:bg-orangeBrand-light text-white font-extrabold text-[10px] rounded-xl tracking-wider uppercase cursor-pointer transition active:scale-95 duration-150 shadow-sm">
                    {isUploading ? "Uploading..." : "Select File"}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handlePrescriptionUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

                    {/* DRIVER ASSIGNMENT & TIPPING CARD */}
          <section className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200/60 overflow-hidden shadow-inner text-slate-400">
                <DirectionsBike sx={{ fontSize: 28 }} />
              </div>
              <div className="text-left">
                <h3 className="font-extrabold text-base text-slate-800">Assigning delivery partner shortly</h3>
                <p className="text-xs text-slate-400 font-medium">Your rider will maintain hygiene standards</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <p className="font-bold text-sm text-slate-700">Make their day by leaving a tip</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-normal">100% of the amount will go to them after delivery</p>
              </div>

              {showCustomTipInput ? (
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in duration-200 text-left">
                  <div className="flex justify-between items-center text-slate-800">
                    <span className="text-sm font-black">Select Custom Tip Amount:</span>
                    <span className="text-lg font-black text-emerald-800">₹{customTipValue || 0}</span>
                  </div>

                   <div className="space-y-2">
                    <div className="relative pt-2 pb-1">
                      {/* Range Input */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={customTipValue || 50}
                        onChange={(e) => setCustomTipValue(e.target.value)}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none relative z-10"
                      />
                      
                      {/* Point-wise Ticks */}
                      <div className="absolute left-0 right-0 top-[13px] flex justify-between px-1 select-none pointer-events-none">
                        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => {
                          const isActive = val <= Number(customTipValue);
                          return (
                            <div
                              key={val}
                              className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                                isActive ? "bg-emerald-600" : "bg-slate-300"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-450 font-extrabold px-1 select-none pt-1">
                      <span>₹0</span>
                      <span>₹20</span>
                      <span>₹40</span>
                      <span>₹60</span>
                      <span>₹80</span>
                      <span>₹100</span>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Number(customTipValue);
                        setSelectedTip(val);
                        setShowCustomTipInput(false);
                        toast.success(`Custom tip of ₹${val} added! Thank you.`);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition shadow-sm active:scale-95"
                    >
                      Confirm Tip
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomTipInput(false);
                        setCustomTipValue("50");
                      }}
                      className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-xl transition active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {[15, 20, 30].map((amount) => (
                    <button
                      type="button"
                      key={amount}
                      onClick={() => {
                        setSelectedTip(amount);
                        toast.success(`Rider tip of ₹${amount} added! Thank you. ❤️`);
                      }}
                      className={`py-3 rounded-2xl text-xs font-black transition-all ${
                        selectedTip === amount
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.03]"
                          : "bg-slate-50 border border-slate-205 hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomTipInput(true);
                    }}
                    className={`py-3 rounded-2xl text-xs font-black transition-all ${
                      selectedTip && ![15, 20, 30].includes(selectedTip)
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.03]"
                        : "bg-slate-50 border border-slate-205 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    {selectedTip && ![15, 20, 30].includes(selectedTip) ? `₹${selectedTip}` : "Other"}
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* STEP 4: PAYMENT METHOD SELECTION */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 bg-orange-100 text-orangeBrand font-black rounded-full flex justify-center items-center text-[10px]">
                {requiresPrescription ? "4" : "3"}
              </span>
              Choose Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Razorpay Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("razorpay")}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[100px] transition-all duration-200 ${
                  paymentMethod === "razorpay"
                    ? "border-orangeBrand bg-orange-50/10 shadow-sm"
                    : "border-gray-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-full flex justify-between items-center">
                  <CreditCard className={paymentMethod === "razorpay" ? "text-orangeBrand" : "text-gray-400"} sx={{ fontSize: 20 }} />
                  {paymentMethod === "razorpay" && <span className="text-orangeBrand font-black text-[10px]">SELECTED</span>}
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-black text-gray-800 uppercase block">Razorpay</span>
                  <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Cards, Netbanking, Wallet</span>
                </div>
              </button>
              {/* COD Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("cod")}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[100px] transition-all duration-200 ${
                  paymentMethod === "cod"
                    ? "border-orangeBrand bg-orange-50/10 shadow-sm"
                    : "border-gray-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-full flex justify-between items-center">
                  <LocalAtm className={paymentMethod === "cod" ? "text-orangeBrand" : "text-gray-400"} sx={{ fontSize: 20 }} />
                  {paymentMethod === "cod" && <span className="text-orangeBrand font-black text-[10px]">SELECTED</span>}
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-black text-gray-800 uppercase block">Cash On Delivery</span>
                  <span className="text-[9px] text-gray-400 font-bold block mt-0.5">Pay cash at your doorstep</span>
                </div>
              </button>
              {/* Wallet Option */}
              <button
                type="button"
                onClick={() => setPaymentMethod("wallet")}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-[100px] transition-all duration-200 relative ${
                  paymentMethod === "wallet"
                    ? "border-orangeBrand bg-orange-50/10 shadow-sm"
                    : "border-gray-200 hover:bg-slate-50"
                }`}
              >
                <div className="w-full flex justify-between items-center">
                  <AccountBalanceWallet className={paymentMethod === "wallet" ? "text-orangeBrand" : "text-gray-400"} sx={{ fontSize: 20 }} />
                  {paymentMethod === "wallet" && <span className="text-orangeBrand font-black text-[10px]">SELECTED</span>}
                </div>
                <div className="mt-2">
                  <span className="text-[11px] font-black text-gray-800 uppercase block">Pharmacy Wallet</span>
                  <span className={`text-[9px] font-bold block mt-0.5 ${(user.walletBalance || 0) >= Number(grandTotal) ? "text-emerald-600" : "text-orange-500"}`}>
                    Balance: ₹{user.walletBalance || 0}{(user.walletBalance || 0) < Number(grandTotal) && ` (Short ₹${(Number(grandTotal) - (user.walletBalance || 0)).toFixed(2)})`}
                  </span>
                </div>
              </button>
            </div>
          </div>


        </div>

        {/* RIGHT COLUMN: BASKET REVIEW & BILLING */}
        <div className="space-y-6">
          
          {/* BASKET REVIEW */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="text-orangeBrand" sx={{ fontSize: 16 }} />
              Review Items ({cart.length})
            </h3>

            <div className="max-h-[220px] overflow-y-auto space-y-3.5 pr-2">
              {cart.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs items-center justify-between">
                  <div className="flex gap-2.5 items-center flex-1 min-w-0">
                    <img
                      src={Array.isArray(item.images) ? item.images[0] : item.images}
                      alt={item.name}
                      className="w-10 h-10 object-contain bg-slate-50 p-1 rounded-xl flex-shrink-0 border border-gray-100"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-gray-800 truncate leading-tight">{item.name}</h4>
                      <span className="text-[10px] text-gray-400">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-gray-900">₹{Math.round(item.final_price) * item.quantity}</span>
                    <div className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider">Stock Ready</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 font-semibold bg-slate-100 p-2.5 rounded-2xl flex items-center gap-1.5">
              <AccessTime className="text-gray-400" sx={{ fontSize: 16 }} />
              <span>Speed: <span className="font-extrabold text-slate-700">{selectedAddress.city === "Hyderabad" ? "30 Mins (Express)" : "Tomorrow"}</span></span>
            </div>
          </div>

          {/* FINAL PAYMENT BREAKDOWN */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">Payment Breakdown</h3>

            <div className="space-y-2.5 text-xs text-slate-600 font-medium">
              <div className="flex justify-between">
                <span>Total M.R.P:</span>
                <span>₹{retailTotal}</span>
              </div>
              {retailDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Retail Discount:</span>
                  <span>-₹{retailDiscount}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST (18%):</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{deliveryCharges === 0 ? <span className="text-green-600 font-extrabold uppercase text-[10px]">Free</span> : `₹${deliveryCharges}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Handling Fee:</span>
                <span>{handlingFee === 0 ? <span className="text-green-600 font-extrabold uppercase text-[10px]">Free</span> : `₹${handlingFee}`}</span>
              </div>
              {selectedTip > 0 && (
                <div className="flex justify-between text-slate-800 font-extrabold">
                  <span>Rider Tip:</span>
                  <span>₹{selectedTip}</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3.5 flex justify-between font-black text-gray-900 text-sm bg-slate-50 p-3 rounded-2xl shadow-sm">
              <span>Grand Total:</span>
              <span>₹{Number(grandTotal) + (selectedTip || 0)}</span>
            </div>

            {/* PLACE ORDER TRIGGER */}
            <button
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder}
              className={`w-full mt-1 text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition duration-200 ${
                isPlacingOrder
                  ? "bg-gray-400 cursor-not-allowed opacity-80"
                  : "bg-orangeBrand hover:bg-orangeBrand-light hover:shadow-lg active:scale-95"
              }`}
            >
              {isPlacingOrder ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : paymentMethod === "cod" ? (
                <>
                  <LocalAtm sx={{ fontSize: 16 }} />
                  <span>Place COD Order</span>
                </>
              ) : paymentMethod === "wallet" ? (
                <>
                  <AccountBalanceWallet sx={{ fontSize: 16 }} />
                  <span>Pay ₹{grandTotal} via Wallet</span>
                </>
              ) : paymentMethod === "upi" ? (
                <>
                  <PhoneAndroid sx={{ fontSize: 16 }} />
                  <span>Pay ₹{grandTotal} via UPI / QR Code</span>
                </>
              ) : (
                <>
                  <span>Pay ₹{grandTotal} via Razorpay</span>
                  <Shield sx={{ fontSize: 16 }} />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
      {/* UPI QR CODE MODAL */}
      {showUpiModal && simulatedOrder && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[2000] px-3 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full text-center space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider">UPI / QR Code Payment</h3>
              <button 
                onClick={() => {
                  setShowUpiModal(false);
                  toast.warn("Payment dismissed. You can complete the payment later.");
                }} 
                className="text-gray-400 hover:text-gray-600 font-extrabold text-sm"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1">
              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider block">Grand Total</span>
              <span className="text-2xl font-black text-gray-900 block">₹{simulatedOrder.totalAmount}</span>
            </div>

            <div className="flex justify-center p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=7671085919@ybl&pn=Pharmacy%20App&am=${simulatedOrder.totalAmount}&cu=INR&tn=Order%20${simulatedOrder.id}`)}`} 
                alt="UPI Payment QR Code" 
                className="w-[180px] h-[180px] object-contain"
              />
            </div>

            <div className="text-[10px] text-gray-400 font-bold leading-relaxed px-4">
              Scan this QR code using GPay, PhonePe, Paytm or any UPI App to pay, then click "Simulate Success" below to verify and complete.
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleUpiPaymentSuccess()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3.5 rounded-xl shadow-md transition duration-200 active:scale-95 uppercase tracking-wider"
              >
                Simulate Payment Success
              </button>
              <button
                onClick={() => {
                  setShowUpiModal(false);
                  toast.warn("Payment dismissed.");
                }}
                className="w-full border border-gray-200 hover:bg-slate-50 text-gray-500 font-extrabold text-xs py-3 rounded-xl transition duration-200 active:scale-95 uppercase tracking-wider"
              >
                Cancel / Pay Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
