import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { calculateFinalPrice, getImageUrl } from "../utils/productUtils";
import { useCart } from "../context/CartContext";
import {
  Star,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  CheckCircle,
  Plus,
  Minus
} from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/products/${id}`)
      .then((res) => {
        if (res.data?.data) {
          setProduct(res.data.data);
          const imgs = res.data.data.images || [];
          setActiveImage(imgs.length > 0 ? imgs[0] : res.data.data.image);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !product) {
    return <div className="py-24 text-center text-xs font-bold text-slate-400">Loading Product Details...</div>;
  }

  const finalPrice = calculateFinalPrice(product.price, product.discount);

  // Direct Checkout bypass (Cart skip karke direct payment par bhejna)
  const handleBuyNow = () => {
    const directItem = {
      ...product,
      finalPrice,
      quantity
    };
    sessionStorage.setItem("direct_checkout_item", JSON.stringify(directItem));
    navigate("/payment?mode=direct");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images Gallery */}
        <div>
          <div className="aspect-square bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm mb-4">
            <img
              src={getImageUrl(activeImage)}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
              }}
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`w-16 h-16 rounded-2xl border-2 overflow-hidden shrink-0 transition ${
                    activeImage === img ? "border-indigo-600 scale-105 shadow-md" : "border-slate-200 opacity-70"
                  }`}
                >
                  <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Top Priority Buy Box */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {product.category}
              </span>
              {product.stock > 0 ? (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> In Stock ({product.stock} left)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-rose-500">Out of Stock</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3 mb-2">{product.name}</h1>

            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-4">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{product.rating || 4.5} Star Rating</span>
            </div>

            {/* Price Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-black text-slate-900">₹{finalPrice.toLocaleString()}</span>
              {product.discount > 0 && (
                <>
                  <span className="text-sm text-slate-400 line-through">₹{Number(product.price).toLocaleString()}</span>
                  <span className="text-xs font-black text-rose-500">{product.discount}% OFF</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-900 w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => (q < product.stock ? q + 1 : q))}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-3 mb-8">
              <button
                onClick={() => addToCart({ ...product, finalPrice }, quantity)}
                className="flex-1 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" /> Buy Now
              </button>
            </div>

            {/* Description Tab */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-black uppercase text-slate-900 mb-2">Description & Details</h4>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                {product.description}
              </p>
            </div>

            {/* Trust Assurances */}
            <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-6 mt-6">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Express Pan-India Delivery within 24-48 hours</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>100% Genuine Direct Warranty on this product</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Hassle-free 7-day doorstep replacement</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Action Bar (Mobile scroll par niche fix rahega) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 md:hidden z-40 flex items-center gap-2 shadow-2xl">
        <button
          onClick={() => addToCart({ ...product, finalPrice }, quantity)}
          className="flex-1 py-3 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-4 h-4" /> Cart
        </button>
        <button
          onClick={handleBuyNow}
          className="flex-1 py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md"
        >
          <Zap className="w-4 h-4" /> Buy Now
        </button>
      </div>
    </div>
  );
}