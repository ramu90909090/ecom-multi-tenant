import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingBag, Zap, Check, ShieldCheck } from "lucide-react";
import { calculateFinalPrice, getImageUrl } from "../utils/productUtils";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart, setCheckoutItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const id = product._id || product.id;

  // Resolve primary image from array or string
  const primaryImage =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images.find((img) => img.isPrimary)?.url || product.images[0]?.url || product.images[0]
      : product.image;

  const basePrice = Number(product.price || product.actualPrice || 0);
  const discountPercent = Number(product.discount || 0);
  const finalPrice = calculateFinalPrice(basePrice, discountPercent);
  const savings = basePrice > finalPrice ? basePrice - finalPrice : 0;

  // 1. Add to Cart Handler
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(
      {
        ...product,
        _id: id,
        id: id,
        finalPrice,
        image: getImageUrl(primaryImage)
      },
      1
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1800);
  };

  // 2. Direct Buy Now Handler (Cart bypass -> Payment Page)
  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const itemToBuy = {
      _id: id,
      id: id,
      name: product.name,
      category: product.category,
      price: basePrice,
      discount: discountPercent,
      finalPrice,
      quantity: 1,
      image: getImageUrl(primaryImage),
      total: finalPrice
    };

    if (typeof setCheckoutItem === "function") {
      setCheckoutItem(itemToBuy);
    }
    sessionStorage.setItem("direct_checkout_item", JSON.stringify(itemToBuy));
    localStorage.setItem("direct_checkout_item", JSON.stringify(itemToBuy));
    navigate("/payment");
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between group h-full">
      
      {/* Top Image & Floating Badges */}
      <Link to={`/product/${id}`} className="relative aspect-square overflow-hidden bg-slate-50 block">
        <img
          src={getImageUrl(primaryImage)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
          }}
        />

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider uppercase">
            {discountPercent}% OFF
          </span>
        )}

        {/* Trending / Hot Badge */}
        {product.isTrending && (
          <span className="absolute top-3 right-3 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
            HOT 🔥
          </span>
        )}
      </Link>

      {/* Body Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md tracking-wider">
              {product.category || "Lifestyle"}
            </span>
            <div className="flex items-center space-x-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{product.rating ? Number(product.rating).toFixed(1) : "4.5"}</span>
            </div>
          </div>

          {/* Product Title */}
          <Link
            to={`/product/${id}`}
            className="text-xs sm:text-sm font-extrabold text-slate-900 hover:text-indigo-600 transition line-clamp-2 leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* Pricing & Savings Box */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg sm:text-xl font-black text-slate-900 font-mono tracking-tight">
              ₹{finalPrice.toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <span className="text-xs text-slate-400 line-through font-semibold font-mono">
                ₹{basePrice.toLocaleString()}
              </span>
            )}
          </div>

          {savings > 0 && (
            <p className="text-[10px] font-extrabold text-emerald-600 flex items-center space-x-1">
              <span>Save ₹{savings.toLocaleString()} instantly</span>
            </p>
          )}
        </div>

        {/* Action Buttons: Add to Cart & Buy Now */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Add to Cart Button */}
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer border ${
              isAdded
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="Add to Cart"
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px]">Added!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-[11px]">Add to Cart</span>
              </>
            )}
          </button>

          {/* Buy Now Button */}
          <button
            type="button"
            onClick={handleBuyNow}
            className="w-full py-2.5 px-2 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold rounded-xl text-[11px] uppercase tracking-wider shadow-md shadow-pink-500/20 active:scale-95 transition flex items-center justify-center space-x-1 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Buy Now</span>
          </button>
        </div>

      </div>
    </div>
  );
}