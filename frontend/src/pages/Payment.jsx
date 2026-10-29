import React, { useState, useEffect, useMemo } from "react";
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
  ShoppingBag,
  MapPin,
  User,
  Phone,
  Mail,
  Tag,
  CheckCircle2,
  ChevronRight,
  X,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Smartphone,
  Percent,
  Truck
} from "lucide-react";
import PaymentInvoice from "../components/payment/PaymentInvoice";
import { getImageUrl, calculateFinalPrice } from "../utils/productUtils";

export default function Payment() {
  const { cart, checkoutItem, clearCart, setCheckoutItem } = useCart();
  const { user } = useAuth();
  const { settings, tenant } = useSettings();
  const navigate = useNavigate();

  // Storage fallback to prevent empty checkout on refresh
  const effectiveCheckoutItem =
    checkoutItem ||
    (() => {
      try {
        const saved =
          sessionStorage.getItem("direct_checkout_item") ||
          localStorage.getItem("direct_checkout_item");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    })();

  const items = useMemo(() => {
    if (effectiveCheckoutItem) return [effectiveCheckoutItem];
    if (cart && cart.length > 0) return cart;
    return [];
  }, [effectiveCheckoutItem, cart]);

  const [stage, setStage] = useState("checkout");
  const [paymentMode, setPaymentMode] = useState("upi");
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalOrderData, setFinalOrderData] = useState(null);

  // Dynamic Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMsg, setCouponMsg] = useState({ type: "", text: "" });

  // Dynamic Category-wise GST State
  const [gstInfo, setGstInfo] = useState({
    rate: 0,
    amount: 0,
    appliedCategory: null,
    ruleApplied: "Evaluating GST..."
  });

  // Dynamic Category-wise Delivery Charge State
  const [deliveryInfo, setDeliveryInfo] = useState({
    fee: 0,
    originalFee: 0,
    appliedCategory: null,
    freeThreshold: 1000,
    isFree: true,
    estimatedDays: "2-4 Business Days",
    ruleNote: "Calculating delivery..."
  });

  // Store Brand & Payment Configuration
  const storeName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";
  const storeSubtitle = settings?.navbar?.brandSubtitle || "Official Store Invoice";

  const paymentConfig = settings?.paymentGateway || settings?.payment || {};
  const merchantUpi = paymentConfig.upiId || "juhip2019@okaxis";
  const merchantName = paymentConfig.merchantName || storeName;
  const verificationNote =
    paymentConfig.verificationNote ||
    `Payment karte waqt verify karein ki receiver UPI ID ${merchantUpi} (Name: ${merchantName}) hi show ho rahi ho.`;
  const codMinAmount = paymentConfig.codMinAmount || 5000;

  // Shipping Form State
  const [shipping, setShipping] = useState({
    name: user?.name || "",
    phone: user?.mobile || user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
    city: user?.district || user?.city || "",
    pincode: user?.pincode || "",
    state: user?.state || "Uttar Pradesh"
  });

  useEffect(() => {
    if (user) {
      setShipping((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || user.mobile || user.phone || "",
        email: prev.email || user.email || "",
        address: prev.address || user.address || "",
        city: prev.city || user.district || user.city || "",
        pincode: prev.pincode || user.pincode || "",
        state: prev.state || user.state || "Uttar Pradesh"
      }));
    }
  }, [user]);

  // Base Subtotal Calculation
  const itemsSubtotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const finalUnit =
        it.finalPrice !== undefined && it.finalPrice !== null
          ? Number(it.finalPrice)
          : calculateFinalPrice(it.price, it.discount);
      return acc + (Number(finalUnit) || 0) * (Number(it.quantity) || 1);
    }, 0);
  }, [items]);

  // Dynamic GST & Delivery Evaluation
  useEffect(() => {
    const evaluatePricing = async () => {
      if (!items.length || itemsSubtotal <= 0) {
        setGstInfo({ rate: 0, amount: 0, appliedCategory: null, ruleApplied: "Cart Empty" });
        setDeliveryInfo({ fee: 0, originalFee: 0, appliedCategory: null, freeThreshold: 1000, isFree: true, estimatedDays: "2-4 Days", ruleNote: "Cart Empty" });
        return;
      }

      const payloadItems = items.map((it) => ({
        product: it._id || it.id,
        category: it.category || "General",
        price: Number(it.finalPrice || it.price || 0),
        quantity: Number(it.quantity || 1)
      }));

      // 1. Evaluate GST
      try {
        const gstRes = await API.post("/gst/calculate", { items: payloadItems, subtotal: itemsSubtotal });
        if (gstRes.data?.success && gstRes.data?.data) {
          setGstInfo({
            rate: Number(gstRes.data.data.gstRate) || 0,
            amount: Number(gstRes.data.data.gstAmount) || 0,
            appliedCategory: gstRes.data.data.appliedCategory,
            ruleApplied: gstRes.data.data.ruleApplied
          });
        }
      } catch {
        setGstInfo({ rate: 0, amount: 0, appliedCategory: null, ruleApplied: "0% GST (Tax Exempted)" });
      }

      // 2. Evaluate Delivery Fee
      try {
        const delRes = await API.post("/delivery/calculate", { items: payloadItems, subtotal: itemsSubtotal });
        if (delRes.data?.success && delRes.data?.data) {
          const d = delRes.data.data;
          setDeliveryInfo({
            fee: Number(d.deliveryFee) || 0,
            originalFee: Number(d.originalFee) || 0,
            appliedCategory: d.appliedCategory,
            freeThreshold: Number(d.freeThreshold) || 1000,
            isFree: Boolean(d.isFree),
            estimatedDays: d.estimatedDays || "2-4 Business Days",
            ruleNote: d.ruleNote || ""
          });
        }
      } catch {
        // Fallback default calculation
        const fallbackFree = itemsSubtotal >= 1000;
        setDeliveryInfo({
          fee: fallbackFree ? 0 : 50,
          originalFee: 50,
          appliedCategory: null,
          freeThreshold: 1000,
          isFree: fallbackFree,
          estimatedDays: "2-4 Business Days",
          ruleNote: fallbackFree ? "Free Delivery" : "Standard Delivery"
        });
      }
    };

    evaluatePricing();
  }, [items, itemsSubtotal]);

  const deliveryFee = deliveryInfo.fee;
  const gstAmount = gstInfo.amount;
  const netPayable = Math.max(0, itemsSubtotal + gstAmount + deliveryFee - couponDiscount);
  const isCodEligible = itemsSubtotal >= codMinAmount;

  const productSummary = useMemo(() => {
    if (!items.length) return "Store Order";
    const names = items.map((i) => i.name).join(", ");
    return names.length > 30 ? names.substring(0, 27) + "..." : names;
  }, [items]);

  const [orderId] = useState(
    () => `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`
  );

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent(
    merchantName
  )}&am=${netPayable}&cu=INR&tr=${orderId}&tn=${encodeURIComponent(`${storeName} | ${orderId}`)}`;

  const configuredQr =
    paymentConfig.qrImageUrl ||
    paymentConfig.paymentQrImage ||
    paymentConfig.qrCodeImage ||
    paymentConfig.qrImage;

  const qrImage = configuredQr
    ? getImageUrl(configuredQr)
    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        upiDeepLink
      )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(merchantUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    const codeToTest = couponCode.trim().toUpperCase();
    if (!codeToTest) {
      setCouponMsg({ type: "error", text: "Kripya coupon code enter karein." });
      return;
    }

    setCouponLoading(true);
    setCouponMsg({ type: "", text: "" });

    try {
      const res = await API.post("/coupons/validate", {
        code: codeToTest,
        items: items.map((it) => ({
          product: it._id || it.id,
          name: it.name,
          category: it.category || "All",
          price: Number(it.finalPrice || it.price || 0),
          quantity: Number(it.quantity || 1)
        })),
        totalAmount: itemsSubtotal,
        cartSubtotal: itemsSubtotal
      });

      if (res.data?.success && res.data?.data) {
        const discountVal = Number(res.data.data.discountAmount) || 0;
        setAppliedCoupon(res.data.data);
        setCouponDiscount(discountVal);
        setCouponMsg({
          type: "success",
          text: res.data.message || `Coupon '${res.data.data.code}' applied!`
        });
      } else {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponMsg({
          type: "error",
          text: res.data?.message || "Invalid coupon code."
        });
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponMsg({
        type: "error",
        text: err.response?.data?.message || "Coupon verify karne me dikkat aayi."
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponMsg({ type: "", text: "" });
  };

  const handleFormChange = (e) => {
    setShipping({ ...shipping, [e.target.name]: e.target.value });
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    setUtrError("");

    if (
      !shipping.name.trim() ||
      !shipping.phone.trim() ||
      !shipping.address.trim() ||
      !shipping.pincode.trim() ||
      !shipping.city.trim()
    ) {
      alert("Kripya saari mandatory delivery details bharein.");
      return;
    }

    if (paymentMode === "upi") {
      const cleanUtr = utrNumber.trim();
      if (!cleanUtr) {
        setUtrError("Bank Transaction UTR / Ref No. daalna mandatory hai.");
        return;
      }
      if (cleanUtr.length < 8) {
        setUtrError("Kripya valid 8-12 digit UTR Number daalein.");
        return;
      }
    }

    if (paymentMode === "cod" && !isCodEligible) {
      alert(`Cash on Delivery sirf ₹${codMinAmount.toLocaleString()} se upar ke orders par available hai.`);
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        orderId,
        items: items.map((it) => ({
          product: it._id || it.id,
          name: it.name,
          category: it.category || "General",
          image: it.image || (Array.isArray(it.images) ? it.images[0]?.url || it.images[0] : ""),
          price: Number(it.finalPrice || it.price || 0),
          quantity: Number(it.quantity || 1),
          total: Number(it.finalPrice || it.price || 0) * Number(it.quantity || 1)
        })),
        shippingDetails: {
          name: shipping.name.trim(),
          phone: shipping.phone.trim(),
          email: shipping.email ? shipping.email.trim() : "",
          address: shipping.address.trim(),
          city: shipping.city.trim(),
          state: shipping.state.trim() || "Uttar Pradesh",
          pincode: shipping.pincode.trim()
        },
        paymentInfo: {
          mode: paymentMode,
          utrNumber: paymentMode === "upi" ? utrNumber.trim() : "COD-PENDING",
          status: paymentMode === "upi" ? "Processing" : "Not Verified"
        },
        pricing: {
          subtotal: itemsSubtotal,
          gstRate: gstInfo.rate,
          gstAmount,
          gstCategoryApplied: gstInfo.appliedCategory,
          deliveryFee,
          deliveryCategoryApplied: deliveryInfo.appliedCategory,
          couponDiscount,
          couponCode: appliedCoupon ? appliedCoupon.code : "",
          totalPayable: netPayable
        },
        userId: user?._id || user?.id || null
      };

      const res = await API.post("/orders", orderPayload);

      if (res.data?.success) {
        const confirmedOrder = res.data.data || orderPayload;
        setFinalOrderData({
          ...confirmedOrder,
          date: new Date().toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
          })
        });

        setStage("success");

        if (typeof setCheckoutItem === "function") setCheckoutItem(null);
        localStorage.removeItem("direct_checkout_item");
        sessionStorage.removeItem("direct_checkout_item");
        if (!effectiveCheckoutItem) {
          clearCart();
        }
      } else {
        alert(res.data?.message || "Order place karne me dikkat aayi.");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Order create nahi ho saka.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && stage !== "success") {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Checkout Khali Hai</h2>
          <p className="text-xs text-slate-500 font-medium">
            Aapne abhi koi product choose nahi kiya hai. Catalog se product select karein.
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
            Order ID <b className="text-slate-800">#{finalOrderData.orderId}</b> generate ho chuka hai. Slip print ya download kar sakte hain.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <PaymentInvoice
            order={finalOrderData}
            finalOrderData={finalOrderData}
            storeName={storeName}
            storeSubtitle={storeSubtitle}
            onBackHome={() => navigate("/")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans">
      {/* Wizard */}
      <div className="bg-white/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center space-x-2 text-indigo-600 font-black text-xs">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">1</span>
          <span>Cart / Buy Now</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="flex items-center space-x-2 text-pink-600 font-black text-xs">
          <span className="w-6 h-6 rounded-full bg-pink-600 text-white flex items-center justify-center text-[11px]">2</span>
          <span>Payment & Address</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <div className="flex items-center space-x-2 text-slate-400 font-bold text-xs">
          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">3</span>
          <span>Receipt / Slip</span>
        </div>
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Payment & Delivery Details */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. SELECT PAYMENT METHOD */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 tracking-tight">1. Select Payment Option</h2>
                <p className="text-[11px] text-slate-400 font-semibold">Direct UPI QR transfer ya Cash on delivery</p>
              </div>
            </div>

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
                  <p className="text-[10px] text-slate-400 font-semibold">GPay, PhonePe, Paytm</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isCodEligible) setPaymentMode("cod");
                  else alert(`Cash on Delivery sirf ₹${codMinAmount.toLocaleString()} se upar ke order par available hai.`);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-3 ${
                  !isCodEligible
                    ? "opacity-50 border-slate-200 bg-slate-100 cursor-not-allowed"
                    : paymentMode === "cod"
                    ? "border-amber-500 bg-amber-50/40 text-amber-800 ring-2 ring-amber-500/20 shadow-sm"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className={`p-2 rounded-xl ${paymentMode === "cod" ? "bg-amber-600 text-white" : "bg-white text-slate-600"}`}>
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black">Cash on Delivery</h4>
                  <p className="text-[10px] text-slate-400 font-semibold">
                    {isCodEligible ? `Available (> ₹${codMinAmount.toLocaleString()})` : `Min ₹${codMinAmount.toLocaleString()} required`}
                  </p>
                </div>
              </button>
            </div>

            {paymentMode === "upi" && (
              <div className="space-y-4 pt-2">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-amber-800">Payment ID Verification Alert:</p>
                    <p className="text-[11px] leading-relaxed">{verificationNote}</p>
                  </div>
                </div>

                {/* DYNAMIC QR CARD */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-100 p-5 rounded-3xl border border-gray-200 flex flex-col sm:flex-row items-center gap-6">
                  <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-md flex flex-col items-center w-64 shrink-0">
                    <div className="text-center pb-2 border-b border-gray-100 w-full">
                      <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                        {storeName}
                      </span>
                      <p className="text-[9px] font-bold text-gray-400">Order: {orderId}</p>
                    </div>

                    <div className="flex items-center space-x-1.5 my-2">
                      <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {merchantName.charAt(0)}
                      </div>
                      <span className="font-extrabold text-xs text-gray-800">{merchantName}</span>
                    </div>

                    <div className="w-48 h-48 rounded-2xl overflow-hidden border border-gray-100 bg-white p-1">
                      <img
                        src={qrImage}
                        alt="Dynamic QR"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                            upiDeepLink
                          )}`;
                        }}
                      />
                    </div>

                    <p className="font-mono text-xs font-bold text-gray-700 mt-2">{merchantUpi}</p>

                    <div className="mt-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 text-center w-full">
                      <p className="text-[10px] text-gray-500 font-bold truncate">For: {productSummary}</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="mt-2 inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[10px] font-bold transition cursor-pointer"
                    >
                      {copiedUpi ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy UPI ID</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 space-y-3 w-full text-xs">
                    <div className="bg-white p-3.5 rounded-2xl border border-gray-200 space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Grand Total Payable</span>
                      <p className="text-2xl font-black text-gray-900">₹{netPayable.toLocaleString()}</p>
                      <div className="pt-1 border-t border-gray-100 space-y-0.5 text-[11px] text-gray-500">
                        <p><strong className="text-gray-700">Store:</strong> {storeName}</p>
                        <p><strong className="text-gray-700">Order ID:</strong> {orderId}</p>
                        <p className="truncate"><strong className="text-gray-700">Items:</strong> {productSummary}</p>
                      </div>
                    </div>

                    <a
                      href={upiDeepLink}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-95 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-md transition"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Pay via UPI App Directly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* UTR Input */}
                <div className="p-4 bg-pink-50/60 rounded-2xl border border-pink-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-xs text-gray-900">
                      Bank Transaction UTR / Ref No. * (Mandatory)
                    </label>
                    <span className="text-[10px] font-bold text-pink-600 bg-white px-2 py-0.5 rounded-md border border-pink-200">
                      Verification Required
                    </span>
                  </div>

                  <input
                    type="text"
                    required
                    maxLength={16}
                    placeholder="Enter 12-digit UTR No. (e.g. 428731908234)"
                    value={utrNumber}
                    onChange={(e) => {
                      setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, ""));
                      setUtrError("");
                    }}
                    className={`w-full bg-white rounded-xl px-3.5 py-2.5 font-mono font-bold text-xs outline-none border transition ${
                      utrError
                        ? "border-rose-500 ring-2 ring-rose-500/20 text-rose-700"
                        : "border-gray-300 focus:border-pink-500 text-gray-900"
                    }`}
                  />
                  {utrError && <p className="text-[11px] font-black text-rose-600">{utrError}</p>}
                </div>
              </div>
            )}

            {paymentMode === "cod" && (
              <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 space-y-1 text-xs text-amber-900">
                <p className="font-bold flex items-center space-x-1.5">
                  <Banknote className="w-4 h-4 text-amber-600" />
                  <span>Cash on Delivery is Active!</span>
                </p>
                <p className="text-[11px] text-gray-600">
                  Parcel receive karte samay delivery agent ko cash ya UPI se pay kar sakte hain.
                </p>
              </div>
            )}
          </div>

          {/* 2. SHIPPING & DELIVERY DETAILS FORM */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">2. Delivery Address</h2>
                  <p className="text-[11px] text-slate-400 font-semibold">Jahan parcel dispatch kiya jayega</p>
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
                <label className="block text-[11px] font-bold text-slate-700 mb-1">WhatsApp / Phone Number *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    name="phone"
                    placeholder="10-digit mobile number"
                    value={shipping.phone}
                    onChange={handleFormChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    name="email"
                    placeholder="email@example.com"
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
        </div>

        {/* Right Column: Order Summary, Dynamic GST, Dynamic Delivery, Coupon & Confirm */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-100 shadow-xl shadow-pink-500/5 space-y-5">
            <h3 className="text-base font-black text-slate-900 tracking-tight pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                {items.length} Product(s)
              </span>
            </h3>

            {/* Items Scroller */}
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1 scrollbar-thin divide-y divide-slate-100">
              {items.map((prod, idx) => {
                const finalUnitPrice = Number(
                  prod.finalPrice !== undefined && prod.finalPrice !== null
                    ? prod.finalPrice
                    : calculateFinalPrice(prod.price, prod.discount)
                );
                const thumb =
                  prod.image ||
                  (Array.isArray(prod.images) && prod.images.length > 0
                    ? typeof prod.images[0] === "object"
                      ? prod.images[0].url
                      : prod.images[0]
                    : "");
                const qty = Number(prod.quantity || 1);

                return (
                  <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getImageUrl(thumb)}
                        alt={prod.name}
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&q=80";
                        }}
                      />
                      <div className="max-w-[150px] sm:max-w-[180px]">
                        <h4 className="font-extrabold text-slate-900 truncate">{prod.name}</h4>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                            {prod.category || "General"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Qty: {qty} × ₹{finalUnitPrice.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-black text-slate-900 text-sm">
                      ₹{(finalUnitPrice * qty).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Coupon Code Input */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Have a Promo Coupon?</label>
              {appliedCoupon ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-black text-emerald-800 uppercase tracking-wider">
                      {appliedCoupon.code} APPLIED
                    </span>
                    <p className="text-[10px] text-emerald-600 font-bold">
                      Saved ₹{couponDiscount.toLocaleString()}{" "}
                      {appliedCoupon.applicableCategory && `(${appliedCoupon.applicableCategory} Category)`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                    title="Remove Coupon"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Enter Promo Coupon..."
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black uppercase outline-none focus:bg-white focus:border-pink-500"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={couponLoading || !couponCode.trim()}
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {couponLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{couponLoading ? "Checking..." : "Apply"}</span>
                    </button>
                  </div>
                  {couponMsg.text && (
                    <p
                      className={`text-[10px] font-bold ${
                        couponMsg.type === "success" ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {couponMsg.text}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Final Bill Breakdown with Category GST & Category Delivery Fee */}
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{itemsSubtotal.toLocaleString()}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-pink-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>-₹{couponDiscount.toLocaleString()}</span>
                </div>
              )}

              {/* DYNAMIC GST ROW */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Percent className="w-3.5 h-3.5 text-pink-600" />
                    <span className="text-slate-800 font-bold">
                      GST {gstInfo.rate > 0 ? `(${gstInfo.rate}%)` : "(0% Exempted)"}
                    </span>
                  </div>
                  {gstInfo.appliedCategory && (
                    <span className="block text-[10px] text-violet-600 font-semibold pl-5">
                      Highest Active Tax Rule: '{gstInfo.appliedCategory}'
                    </span>
                  )}
                </div>
                <span className="font-bold text-slate-900">
                  {gstAmount > 0 ? `+₹${gstAmount.toLocaleString()}` : "₹0"}
                </span>
              </div>

              {/* DYNAMIC CATEGORY DELIVERY ROW */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-slate-800 font-bold">Delivery Charges</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 font-medium pl-5">
                    {deliveryInfo.ruleNote}
                  </span>
                </div>
                <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "font-bold text-slate-900"}>
                  {deliveryFee === 0 ? "FREE" : `+₹${deliveryFee}`}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline text-sm">
                <span className="font-black text-slate-900 uppercase tracking-tight">Total Payable</span>
                <span className="text-2xl font-black bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
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