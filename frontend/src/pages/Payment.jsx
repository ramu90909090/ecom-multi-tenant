import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import API from "../api/axios";
import PaymentShippingForm from "../components/payment/PaymentShippingForm";
import PaymentQrCard from "../components/payment/PaymentQrCard";
import PaymentInvoice from "../components/payment/PaymentInvoice";
import { Tag, Check, ArrowRight } from "lucide-react";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart, subtotal: cartSubtotal, clearCart } = useCart();
  const { settings, tenant } = useSettings();

  // Check if user came from "Buy Now" direct button
  const isDirect = location.search.includes("mode=direct");
  const directItem = isDirect ? JSON.parse(sessionStorage.getItem("direct_checkout_item") || "null") : null;

  const activeItems = isDirect && directItem ? [directItem] : cart;
  const rawSubtotal = isDirect && directItem
    ? (directItem.finalPrice || directItem.price) * (directItem.quantity || 1)
    : cartSubtotal;

  const [shippingDetails, setShippingDetails] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    state: "Uttar Pradesh"
  });

  const [paymentMode, setPaymentMode] = useState("upi");
  const [utrNumber, setUtrNumber] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(null);

  // Auto-apply or validate coupon
  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === "KHA10") {
      const discount = Math.round((rawSubtotal * 10) / 100);
      setCouponDiscount(discount);
      setCouponApplied(true);
    } else {
      alert("Invalid coupon code! Try using 'KHA10' for 10% instant off.");
    }
  };

  const totalPayable = Math.max(0, rawSubtotal - couponDiscount);

  if (orderCreated) {
    return <PaymentInvoice order={orderCreated} storeName={tenant?.storeName || settings?.navbar?.brandName} />;
  }

  if (activeItems.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="text-xl font-black text-slate-800">No items ready for checkout</h2>
        <button
          onClick={() => navigate("/products")}
          className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs"
        >
          Explore Store
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (paymentMode === "upi" && (!utrNumber || utrNumber.length < 6)) {
      alert("⚠️ Kripya valid 12-digit Bank UTR / Reference number daalein!");
      return;
    }

    setSubmitting(true);
    try {
      const orderPayload = {
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
        items: activeItems,
        shippingDetails,
        paymentInfo: {
          mode: paymentMode,
          utrNumber: paymentMode === "upi" ? utrNumber.trim() : "N/A"
        },
        pricing: {
          subtotal: rawSubtotal,
          gstAmount: 0,
          deliveryFee: 0,
          couponDiscount,
          totalPayable
        }
      };

      const res = await API.post("/orders", orderPayload);
      if (res.data?.success) {
        if (!isDirect) clearCart();
        sessionStorage.removeItem("direct_checkout_item");
        setOrderCreated(res.data.data);
      }
    } catch (err) {
      alert(`❌ Order failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Complete Checkout</h1>
      <form onSubmit={handlePlaceOrder}>
        {/* Step 1: Shipping Address Form */}
        <PaymentShippingForm shippingDetails={shippingDetails} setShippingDetails={setShippingDetails} />

        {/* Step 2: Order Items Summary & Coupon Code */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-sm font-black text-slate-800 mb-3">2. Items & Instant Promo Code</h3>
          <div className="space-y-2 mb-4 text-xs font-bold text-slate-600">
            {activeItems.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                <span>{it.name} (x{it.quantity})</span>
                <span className="text-slate-900">₹{((it.finalPrice || it.price) * (it.quantity || 1)).toLocaleString()}</span>
              </div>
            ))}
          </div>

          {/* Coupon Input */}
          <div className="flex gap-2 max-w-sm mt-3">
            <input
              type="text"
              placeholder="Enter Promo Code (e.g. KHA10)"
              value={couponCode}
              disabled={couponApplied}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs uppercase font-bold"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              disabled={couponApplied}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs"
            >
              {couponApplied ? "Applied!" : "Apply"}
            </button>
          </div>
          {couponApplied && (
            <p className="text-[11px] text-emerald-600 font-bold mt-1">
              ✅ Promo KHA10 applied: ₹{couponDiscount.toLocaleString()} saved!
            </p>
          )}
        </div>

        {/* Step 3: Payment Method & Dynamic UPI QR */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
          <h3 className="text-sm font-black text-slate-800 mb-4">3. Choose Payment Method</h3>
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value="upi"
                checked={paymentMode === "upi"}
                onChange={() => setPaymentMode("upi")}
              />
              UPI QR Code & Scan
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="radio"
                name="paymentMode"
                value="cod"
                checked={paymentMode === "cod"}
                onChange={() => setPaymentMode("cod")}
              />
              Cash on Delivery (COD)
            </label>
          </div>

          {paymentMode === "upi" && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <PaymentQrCard
                upiId={settings?.paymentGateway?.upiId || "juhip2019@okaxis"}
                merchantName={settings?.paymentGateway?.merchantName || tenant?.storeName || "Store"}
                totalPayable={totalPayable}
                customQrUrl={settings?.paymentGateway?.qrImageUrl}
              />
              <div className="mt-4 max-w-sm mx-auto">
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter 12-digit Bank UTR / Ref Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 408219208392"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-center tracking-wider"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
        >
          {submitting ? "Confirming Order..." : `Confirm & Place Order (₹${totalPayable.toLocaleString()})`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}