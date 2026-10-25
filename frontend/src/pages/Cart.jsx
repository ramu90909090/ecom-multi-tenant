import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { calculateFinalPrice, getImageUrl } from "../utils/productUtils";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowLeft
} from "lucide-react";

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, setCheckoutItem } = useCart();
  const navigate = useNavigate();

  // Safe formatting helper to prevent any undefined crashes
  const formatINR = (val) => {
    const num = Number(val);
    return isNaN(num) ? "0" : num.toLocaleString("en-IN");
  };

  // 1. Dynamic Sum: Total MRP (Original price * quantity)
  const totalOriginalMRP = useMemo(() => {
    return (cart || []).reduce((acc, item) => {
      const price = Number(item?.price || item?.actualPrice) || 0;
      const qty = Number(item?.quantity) || 1;
      return acc + price * qty;
    }, 0);
  }, [cart]);

  // 2. Dynamic Sum: Discounted Base Subtotal (Unit Final Price * quantity)
  const totalDiscountedBase = useMemo(() => {
    return (cart || []).reduce((acc, item) => {
      const base = Number(item?.price || item?.actualPrice) || 0;
      const disc = Number(item?.discount) || 0;
      const finalUnit =
        item?.finalPrice !== undefined && item?.finalPrice !== null
          ? Number(item.finalPrice)
          : calculateFinalPrice(base, disc);
      const qty = Number(item?.quantity) || 1;
      return acc + (finalUnit || 0) * qty;
    }, 0);
  }, [cart]);

  // Total Instant Savings
  const totalSavings = totalOriginalMRP > totalDiscountedBase ? totalOriginalMRP - totalDiscountedBase : 0;

  // Delivery Rule: Orders < ₹1000 have ₹50 delivery charge, else FREE
  const isFreeDelivery = totalDiscountedBase >= 1000 || totalDiscountedBase === 0;
  const deliveryFee = isFreeDelivery ? 0 : 50;

  // 18% GST Calculation
  const gstAmount = Math.round(totalDiscountedBase * 0.18);

  // Final Net Payable Amount
  const finalPayable = totalDiscountedBase + gstAmount + deliveryFee;

  // Proceed to Checkout Handler
  const handleProceedToBuy = () => {
    if (typeof setCheckoutItem === "function") {
      setCheckoutItem(null); // Direct cart checkout mode
    }
    sessionStorage.removeItem("direct_checkout_item");
    localStorage.removeItem("direct_checkout_item");
    navigate("/payment");
  };

  // Empty Cart Screen
  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-20 h-20 bg-pink-50 text-pink-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-10 h-10 animate-bounce" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Aapka Cart Khali Hai</h2>
          <p className="text-xs text-slate-500">
            Aapne abhi tak cart me koi product add nahi kiya hai.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-pink-500/20 active:scale-95 transition"
        >
          <span>Explore Catalog</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
            Shopping Bag
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Review Cart Items ({cart.length})
          </h1>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-pink-600 hover:text-violet-600 transition self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Main Grid: Cart Items List on Left (7 cols), Dynamic Summary on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Cart Items */}
        <div className="lg:col-span-7 space-y-4">
          {cart.map((item, idx) => {
            const itemId = item?._id || item?.id || idx;
            const itemQty = Number(item?.quantity) || 1;
            const basePrice = Number(item?.price || item?.actualPrice) || 0;
            const discountPercent = Number(item?.discount) || 0;

            const finalUnitPrice =
              item?.finalPrice !== undefined && item?.finalPrice !== null
                ? Number(item.finalPrice)
                : calculateFinalPrice(basePrice, discountPercent);

            // Item-Level Subtotal (Unit price * quantity)
            const itemSubtotal = finalUnitPrice * itemQty;
            const itemStock = item?.stock !== undefined ? Number(item.stock) : 99;

            // Safe image resolver
            const itemImage =
              item?.image ||
              (Array.isArray(item?.images) && item.images.length > 0
                ? typeof item.images[0] === "object"
                  ? item.images[0].url
                  : item.images[0]
                : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80");

            return (
              <div
                key={itemId}
                className="flex flex-col sm:flex-row gap-4 p-4 sm:p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition duration-200"
              >
                {/* Product Thumbnail */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                  <img
                    src={getImageUrl(itemImage)}
                    alt={item?.name || "Product"}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
                    }}
                  />
                </div>

                {/* Details & Live Quantity Controls */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      {item?.category && (
                        <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                      <Link to={`/product/${itemId}`}>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 hover:text-pink-600 transition line-clamp-1 mt-1">
                          {item?.name || "Product Item"}
                        </h3>
                      </Link>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(itemId)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="Remove Item from Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Unit Price Row */}
                  <div className="flex items-baseline space-x-2">
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{formatINR(finalUnitPrice)}
                    </span>
                    {discountPercent > 0 && (
                      <>
                        <span className="text-xs text-slate-400 line-through font-semibold font-mono">
                          ₹{formatINR(basePrice)}
                        </span>
                        <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Quantity Increase/Decrease & Item Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50 shadow-sm">
                      <button
                        type="button"
                        onClick={() => updateQuantity(itemId, -1)}
                        className="px-3 py-1 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                        title="Decrease Quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-xs font-black bg-white text-slate-900 border-x border-slate-200">
                        {itemQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (itemQty >= itemStock) {
                            alert(`Sirf ${itemStock} units hi available hain.`);
                            return;
                          }
                          updateQuantity(itemId, 1);
                        }}
                        className="px-3 py-1 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                        title="Increase Quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Live Item Subtotal: (Final Price * Quantity) */}
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-semibold block">
                        Subtotal ({itemQty} {itemQty === 1 ? "unit" : "units"})
                      </span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        ₹{formatINR(itemSubtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Dynamic Price Details & Summary */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-pink-500/5 space-y-5">
            <h2 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-3 text-xs font-bold text-slate-600">
              <div className="flex justify-between items-center">
                <span>Total Items MRP</span>
                <span className="font-mono font-black text-slate-900">
                  ₹{formatINR(totalOriginalMRP)}
                </span>
              </div>

              {totalSavings > 0 && (
                <div className="flex justify-between items-center text-pink-600">
                  <span>Product Instant Discount</span>
                  <span className="font-mono font-black">-₹{formatINR(totalSavings)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Estimated GST (18%)</span>
                <span className="font-mono font-black text-slate-900">
                  +₹{formatINR(gstAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Delivery Charges</span>
                <span className={`font-black ${isFreeDelivery ? "text-emerald-600" : "text-amber-600 font-mono"}`}>
                  {isFreeDelivery ? "FREE EXPRESS" : `+₹${formatINR(deliveryFee)}`}
                </span>
              </div>

              {!isFreeDelivery && (
                <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-semibold">
                  Tip: ₹1,000 se zyada ki purchase par delivery bilkul FREE ho jayegi!
                </p>
              )}

              <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline font-black text-slate-900">
                <span className="text-sm">Final Payable Amount</span>
                <span className="text-2xl font-mono bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                  ₹{formatINR(finalPayable)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleProceedToBuy}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-pink-500/25 active:scale-98 transition cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Assurance Badges */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500">
              <div className="p-2 bg-slate-50 rounded-xl space-y-0.5">
                <Truck className="w-3.5 h-3.5 text-violet-600 mx-auto" />
                <p className="text-slate-800">Fast Shipping</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl space-y-0.5">
                <RotateCcw className="w-3.5 h-3.5 text-pink-600 mx-auto" />
                <p className="text-slate-800">7 Days Return</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl space-y-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mx-auto" />
                <p className="text-slate-800">100% Genuine</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}