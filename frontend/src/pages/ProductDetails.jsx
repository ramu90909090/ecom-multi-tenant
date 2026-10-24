import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ShoppingCart,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Tag,
  CheckCircle2,
  Share2,
  Heart
} from "lucide-react";
import API from "../api/axios";
import { useCart } from "../context/CartContext";
import { getImageUrl } from "../utils/productUtils";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setCheckoutItem } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/products/${id}`);
        if (res.data?.success && res.data.data) {
          const prodData = res.data.data;
          setProduct(prodData);

          if (Array.isArray(prodData.images) && prodData.images.length > 0) {
            setSelectedImage(prodData.images[0]?.url || prodData.images[0]);
          } else if (prodData.image) {
            setSelectedImage(prodData.image);
          }
        } else {
          setError("Product nahi mila.");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Product load karne me dikkat aayi.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <h2 className="text-xl font-black text-slate-800">⚠️ {error || "Product unavailable"}</h2>
        <button
          onClick={() => navigate("/products")}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition cursor-pointer"
        >
          Browse All Products
        </button>
      </div>
    );
  }

  // Price Calculation
  const basePrice = Number(product.price || product.actualPrice || 0);
  const discountPercent = Number(product.discount || 0);
  const finalUnitPrice = discountPercent > 0
    ? Math.round(basePrice - (basePrice * discountPercent) / 100)
    : Number(product.sellingPrice || basePrice);

  // Normal Add to Cart
  const handleAddToCart = () => {
    addToCart({
      ...product,
      finalPrice: finalUnitPrice,
      quantity
    });
    alert("✅ Product Cart me add ho gaya!");
  };

  // Direct Buy Now (Bypasses Cart & saves to Context + LocalStorage)
  const handleBuyNow = () => {
    const buyNowProduct = {
      _id: product._id || product.id,
      id: product._id || product.id,
      name: product.name,
      category: product.category,
      price: basePrice,
      discount: discountPercent,
      finalPrice: finalUnitPrice,
      quantity: quantity || 1,
      image: selectedImage || (Array.isArray(product.images) && product.images.length > 0 ? (typeof product.images[0] === 'object' ? product.images[0].url : product.images[0]) : product.image),
      total: finalUnitPrice * (quantity || 1)
    };

    if (typeof setCheckoutItem === "function") {
      setCheckoutItem(buyNowProduct);
    } else {
      localStorage.setItem("direct_checkout_item", JSON.stringify(buyNowProduct));
    }

    // Direct navigate to /payment
    navigate("/payment");
  };

  const imagesList = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img) => (typeof img === "object" ? img.url : img))
    : product.image ? [product.image] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Gallery Image View */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm aspect-square flex items-center justify-center overflow-hidden">
            <img
              src={getImageUrl(selectedImage)}
              alt={product.name}
              className="w-full h-full object-contain rounded-2xl transition duration-300 hover:scale-105"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80";
              }}
            />
          </div>

          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {imagesList.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`w-16 h-16 rounded-2xl border-2 overflow-hidden shrink-0 transition bg-white p-1 cursor-pointer ${
                    selectedImage === imgUrl
                      ? "border-pink-600 ring-2 ring-pink-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <img
                    src={getImageUrl(imgUrl)}
                    alt=""
                    className="w-full h-full object-cover rounded-xl"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-violet-50 text-violet-700 font-black text-[10px] uppercase tracking-wider rounded-full border border-violet-200">
                {product.category || "General"}
              </span>
              {product.stock > 0 ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] uppercase tracking-wider rounded-full border border-emerald-200">
                  In Stock ({product.stock} units)
                </span>
              ) : (
                <span className="px-3 py-1 bg-rose-50 text-rose-700 font-black text-[10px] uppercase tracking-wider rounded-full border border-rose-200">
                  Sold Out
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.name}
            </h1>

            <div className="flex items-center space-x-2 pt-1 text-xs">
              <div className="flex items-center text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-black text-slate-800 ml-1">4.5</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-semibold">120+ Verified Ratings</span>
            </div>
          </div>

          <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900">
              ₹{finalUnitPrice.toLocaleString()}
            </span>
            {discountPercent > 0 && (
              <>
                <span className="text-base text-slate-400 line-through font-bold">
                  ₹{basePrice.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 bg-pink-100 text-pink-700 font-black text-xs rounded-lg">
                  {discountPercent}% OFF
                </span>
              </>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {product.description || "High quality product with genuine brand warranty and swift express delivery."}
          </p>

          <div className="flex items-center space-x-3 pt-2">
            <span className="text-xs font-bold text-slate-500">Quantity:</span>
            <div className="flex items-center border border-slate-200 bg-white rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3 py-1.5 hover:bg-slate-100 font-black text-slate-600 transition cursor-pointer"
              >
                -
              </button>
              <span className="px-4 py-1.5 font-bold text-xs text-slate-900">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => (product.stock ? Math.min(product.stock, q + 1) : q + 1))}
                className="px-3 py-1.5 hover:bg-slate-100 font-black text-slate-600 transition cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="py-3.5 px-6 rounded-2xl border-2 border-slate-900 hover:bg-slate-900 hover:text-white font-extrabold text-xs uppercase tracking-wider text-slate-900 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add To Cart</span>
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy Now</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
            <div className="p-3 bg-slate-50/60 rounded-2xl">
              <Truck className="w-4 h-4 text-pink-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-600 block">Fast Delivery</span>
            </div>
            <div className="p-3 bg-slate-50/60 rounded-2xl">
              <RotateCcw className="w-4 h-4 text-violet-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-600 block">7 Days Return</span>
            </div>
            <div className="p-3 bg-slate-50/60 rounded-2xl">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-600 block">Brand Warranty</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}