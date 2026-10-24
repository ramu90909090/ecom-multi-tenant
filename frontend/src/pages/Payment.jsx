import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import API from "../api/axios";
import {
  ShieldCheck,
  CreditCard,
  Banknote,
  Copy,
  Check,
  QrCode,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  Truck,
  MapPin,
  User,
  Phone,
  Mail,
  AlertCircle,
  Tag,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import PaymentInvoice from "../components/payment/PaymentInvoice";
import { getImageUrl } from "../utils/productUtils";

export default function Payment() {
  const { cart, checkoutItem, clearCart } = useCart();
  const { user } = useAuth();
  const { settings, tenant } = useSettings();
  const navigate = useNavigate();

  // Buy Now single product ya entire cart list
  const items = checkoutItem ? [checkoutItem] : cart;

  // Checkout Stages: "checkout" | "success"
  const [stage, setStage] = useState("checkout");
  const [paymentMode, setPaymentMode] = useState("upi"); // "upi" | "cod"
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalOrderData, setFinalOrderData] = useState(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState({ type: "", text: "" });

  // Store Brand Configs
  const storeName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";
  const merchantUpi = settings?.payment?.upiId || "juhip2019@okaxis";
  const merchantName = settings?.payment?.merchantName || storeName;
  const qrImage = settings?.payment?.qrCodeImage || "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=" + merchantUpi;

  // Shipping Form State (Auto-filled if user is logged in)
  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    state: "Uttar Pradesh"
  });

  useEffect(() => {
    if (user) {
      setShipping({
        name: user.name || "",
        phone: user.mobile || "",
        email: user.email || "",
        address: user.address || "",
        city: user.district || user.city || "",
        pincode: user.pincode || "",
        state: user.state || "Uttar Pradesh"
      });
    }
  }, [user]);

  // Calculations
  const itemsSubtotal = items.reduce((acc, it) => {
    const unitPrice = Number(it.finalPrice || it.price || 0);
    return acc + unitPrice * (it.quantity || 1);
  }, 0);

  // Business Rules: Free Delivery above ₹1000, else ₹50. GST 18% inclusive/calculated.
  const deliveryFee = itemsSubtotal >= 1000 || itemsSubtotal === 0 ? 0 : 50;
  const gstAmount = Math.round(itemsSubtotal * 0.18);
  const netPayable = Math.max(0, itemsSubtotal + deliveryFee - couponDiscount);
  const isCodEligible = itemsSubtotal >= 5000;

  // Dynamic UPI Deep-link for Mobile Instant Pay
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${netPayable}&cu=INR&tn=${encodeURIComponent(`Order from ${storeName}`)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === "KHA10") {
      const discount = Math.round(itemsSubtotal * 0.1);
      setCouponDiscount(discount);
      setCouponMsg({ type: "success", text: "KHA10 Applied! 10% instant discount mil gaya." });
    } else {
      setCouponDiscount(0);
      setCouponMsg({ type: "error", text: "Invalid Code. Use 'KHA10' to get 10% discount." });
    }
  };

  const handleFormChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  // Submit & Create Order
  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setUtrError("");

    // Validate Shipping Form
    if (!shipping.name || !shipping.phone || !shipping.address || !shipping.pincode) {
      alert("Kripya saari required delivery details bharein.");
      return;
    }

    // Validate Payment Mode
    if (paymentMode === "upi") {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr) {
        setUtrError("Payment complete karne ke liye 12-digit UTR/UPI Reference Number daalna zaroori hai.");
        return;
      }
      if (cleanUtr.length < 8) {
        setUtrError("Kripya valid bank UTR / Ref Number (minimum 8-12 digits) enter karein.");
        return;
      }
    }

    if (paymentMode === "cod" && !isCodEligible) {
      alert("Cash On Delivery sirf ₹5,000 se upar ke orders par available hai.");
      return;
    }

    setIsProcessing(true);
    const generatedOrderId = "ORD-" + Date.now().toString().slice(-6);

    try {
      const orderPayload = {
        orderId: generatedOrderId,
        items: items.map((it) => ({
          product: it._id || it.id,
          name: it.name,
          image: it.image || (Array.isArray(it.images) ? it.images[0] : ""),
          price: it.finalPrice || it.price,
          quantity: it.quantity || 1,
          total: (it.finalPrice || it.price) * (it.quantity || 1)
        })),
        shippingDetails: shipping,
        paymentInfo: {
          mode: paymentMode,
          utrNumber: paymentMode === "upi" ? utrNumber.trim() : "COD-PENDING",
          status: paymentMode === "upi" ? "Processing" : "Not Verified"
        },
        pricing: {
          subtotal: itemsSubtotal,
          gstAmount,
          deliveryFee,
          couponDiscount,
          totalPayable: netPayable
        },
        userId: user?._id || null
      };

      await API.post("/orders", orderPayload);

      setFinalOrderData({
        ...orderPayload,
        date: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      });

      setStage("success");
      if (!checkoutItem) clearCart();
    } catch (err) {
      console.error("Order submission error:", err);
      alert(err.response?.data?.message || err.message || "Order create karne me problem aayi. Stock verify karein.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Empty checkout guard
  if (items.length === 0 && stage !== "success") {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Checkout Khali Hai</h2>
          <p className="text-xs text-slate-500 font-medium">
            Aapne abhi koi product select nahi kiya hai. Kisi bhi product par <b>Buy Now</b> click karein ya cart me add karein.
          </p>
          <button
            onClick={() => navigate("/products")}
            className="w-full py-3 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-pink-500/20 hover:opacity-95 transition cursor-pointer"
          >
            Explore Catalog
          </button>
        </div>
      </div>
    );
  }

  // Stage: Order Success / Invoice
  if (stage === "success" && finalOrderData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            Order Safaltapoorvak Place Ho Gaya!
          </h1>
          <p className="text-xs text-slate-500">
            Aapka Order ID <b className="text-slate-800">#{finalOrderData.orderId}</b> generate ho chuka hai. Slip niche se print ya save karein.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <PaymentInvoice
            order={finalOrderData}
            storeName={storeName}
            onBackHome={() => navigate("/")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Interactive Step Progress Wizard */}
      <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center space-x-2 text-indigo-600 font-black text-xs">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">1</span>
          <span>Cart / Buy Now</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="flex items-center space-x-2 text-pink-600 font-black text-xs">
          <span className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-[11px]">2</span>
          <span>Delivery & UPI Pay</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="flex items-center space-x-2 text-slate-400 font-bold text-xs">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">3</span>
          <span>Receipt / Invoice</span>
        </div>
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Delivery Details & Payment Tabs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* A. Shipping Destination Card */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">1. Delivery Address</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">Jahan order dispatch kiya jayega</p>
                </div>
              </div>
              {user && (
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-200">
                  Profile Synced
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Recipient Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    name="name"
                    placeholder="e.g. Rahul Tiwari"
                    value={shipping.name}
                    onChange={handleFormChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number (WhatsApp) *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    name="phone"
                    placeholder="10-digit mobile"
                    value={shipping.phone}
                    onChange={handleFormChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email (For Invoice Slip) *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    name="email"
                    placeholder="name@example.com"
                    value={shipping.email}
                    onChange={handleFormChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">House No., Building, Street Area *</label>
                <input
                  type="text"
                  required
                  name="address"
                  placeholder="e.g. Flat 402, Shivam Enclave, Alambagh"
                  value={shipping.address}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">City / District *</label>
                <input
                  type="text"
                  required
                  name="city"
                  placeholder="e.g. Lucknow"
                  value={shipping.city}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  name="pincode"
                  placeholder="e.g. 226005"
                  value={shipping.pincode}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* B. Interactive Payment Method Selector */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">2. Select Payment Option</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Direct UPI QR transfer ya Cash on delivery</p>
              </div>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode("upi")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                  paymentMode === "upi"
                    ? "border-pink-500 bg-pink-50/40 text-pink-700 ring-2 ring-pink-500/20 shadow-sm"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMode === "upi" ? "bg-pink-600 text-white" : "bg-white text-slate-600"}`}>
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black">UPI QR Instant Pay</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">GPay, PhonePe, Paytm, BHIM</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("cod")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                  paymentMode === "cod"
                    ? "border-emerald-500 bg-emerald-50/40 text-emerald-800 ring-2 ring-emerald-500/20 shadow-sm"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMode === "cod" ? "bg-emerald-600 text-white" : "bg-white text-slate-600"}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-xs font-black">Cash On Delivery</h4>
                    {isCodEligible && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded">Eligible</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold">Orders &gt; ₹5,000 only</p>
                </div>
              </button>
            </div>

            {/* UPI QR Payment Detail View */}
            {paymentMode === "upi" && (
              <div className="p-5 rounded-3xl bg-gradient-to-br from-violet-50/60 via-pink-50/30 to-amber-50/40 border border-pink-100 space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  
                  {/* Dynamic QR Box */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-md text-center shrink-0">
                    <img
                      src={qrImage}
                      alt="UPI QR Code"
                      className="w-36 h-36 object-contain rounded-xl mx-auto"
                      onError={(e) => {
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiDeepLink)}`;
                      }}
                    />
                    <span className="text-[10px] font-black text-slate-500 mt-1.5 block uppercase tracking-wider">
                      Scan to Pay ₹{netPayable.toLocaleString()}
                    </span>
                  </div>

                  {/* Merchant Details & Deep Link */}
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-pink-600">Merchant UPI VPA</span>
                      <div className="flex items-center justify-center sm:justify-start space-x-2 mt-0.5">
                        <code className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                          {merchantUpi}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-lg transition cursor-pointer"
                          title="Copy UPI ID"
                        >
                          {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Mobile 1-Click Pay Button */}
                    <a
                      href={upiDeepLink}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-pink-500/20 hover:opacity-95 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Tap to Pay on Mobile App</span>
                    </a>
                  </div>
                </div>

                {/* Mandatory UTR / Reference Input Box */}
                <div className="pt-3 border-t border-pink-200/60">
                  <label className="block text-xs font-black text-slate-900 uppercase tracking-wider mb-1">
                    Enter Bank UTR / Reference No. (12 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="e.g. 4289XXXXXXXX (Payment screenshot se 12-digit UTR)"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ""));
                      setUtrError("");
                    }}
                    className={`w-full px-4 py-2.5 rounded-2xl text-xs font-black tracking-widest outline-none bg-white transition border ${
                      utrError
                        ? "border-rose-500 ring-2 ring-rose-500/20 text-rose-700"
                        : "border-slate-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 text-slate-900"
                    }`}
                  />
                  {utrError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{utrError}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* COD Warning/Notice View */}
            {paymentMode === "cod" && (
              <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 space-y-2">
                <div className="flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-800">Cash On Delivery Policy</span>
                </div>
                {isCodEligible ? (
                  <p className="text-emerald-700 font-bold">
                    ✓ Aapka cart amount ₹5,000 se upar hai, isliye aapka order Cash On Delivery ke liye eligible hai. Delivery agent ko cash provide karein.
                  </p>
                ) : (
                  <p className="text-rose-600 font-bold">
                    ⚠️ COD sirf ₹5,000 se adhik ke orders par uplabdh hai. Aapka order amount ₹{itemsSubtotal.toLocaleString()} hai. Kripya UPI QR payment option select karein.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Column: Sticky Summary, Items & Confirm Button (5 cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-pink-500/5 space-y-5">
            <h3 className="text-base font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-bold text-pink-600">{items.length} Product(s)</span>
            </h3>

            {/* Selected Items List */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {items.map((item, idx) => {
                const img = item.image || (Array.isArray(item.images) ? item.images[0] : "");
                const itemPrice = Number(item.finalPrice || item.price || 0);

                return (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getImageUrl(img)}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80";
                        }}
                      />
                      <div className="max-w-[150px] sm:max-w-[180px]">
                        <p className="font-extrabold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-semibold">Qty: {item.quantity || 1} • ₹{itemPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      ₹{(itemPrice * (item.quantity || 1)).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Input */}
            <div className="pt-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Coupon (e.g. KHA10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:bg-white focus:border-pink-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Apply
                </button>
              </div>
              {couponMsg.text && (
                <p className={`text-[10px] font-bold mt-1.5 ${couponMsg.type === "success" ? "text-emerald-600" : "text-rose-600"}`}>
                  {couponMsg.text}
                </p>
              )}
            </div>

            {/* Bill Breakdown */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{itemsSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18% Calculated)</span>
                <span className="font-bold text-slate-900">₹{gstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "font-bold text-slate-900"}>
                  {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
                </span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-pink-600 font-bold">
                  <span>Promo Discount (10%)</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-baseline pt-3 border-t border-slate-100 text-sm">
                <span className="font-black text-slate-900 uppercase tracking-tight">Total Payable</span>
                <span className="text-xl font-black bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                  ₹{netPayable.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Confirm & Place Order Action Button */}
            <button
              type="submit"
              disabled={isProcessing || (paymentMode === "cod" && !isCodEligible)}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-pink-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {paymentMode === "upi"
                      ? `Confirm & Verify Payment (₹${netPayable.toLocaleString()})`
                      : `Place COD Order (₹${netPayable.toLocaleString()})`}
                  </span>
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-slate-400 font-semibold">
              🔒 256-bit Encrypted Checkout • Instant WhatsApp Notification Dispatched
            </p>
          </div>

        </div>

      </form>
    </div>
  );
}