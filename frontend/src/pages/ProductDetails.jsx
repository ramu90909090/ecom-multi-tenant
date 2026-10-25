import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../api/axios";
import { useCart } from "../context/CartContext";
import { calculateFinalPrice, getImageUrl } from "../utils/productUtils";
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  ShoppingCart,
  Zap,
  ArrowLeft,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
  HelpCircle,
  CheckCircle2,
  Minus,
  Plus
} from "lucide-react";
import ProductCarousel from "../components/ProductCarousel";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setCheckoutItem } = useCart();

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddedToast, setIsAddedToast] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

  // Touch Swipe for Image Stage
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const fallbackImg =
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const [productRes, allRes] = await Promise.all([
          API.get(`/products/${id}`),
          API.get("/products")
        ]);
        setProduct(productRes.data?.data);
        setAllProducts(allRes.data?.data || []);
        setActiveImageIndex(0);
      } catch (err) {
        console.error("Fetch product error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetails();
  }, [id]);

  // Normalize Images List
  const imagesList = useMemo(() => {
    if (!product) return [fallbackImg];
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map((img) => (typeof img === "object" ? img.url : img));
    }
    return product.image ? [product.image] : [fallbackImg];
  }, [product]);

  // Dynamic Random Recommendations
  const relatedRandomProducts = useMemo(() => {
    if (!allProducts.length || !product) return [];
    const currentId = product._id || product.id;
    return allProducts
      .filter((p) => (p._id || p.id) !== currentId)
      .sort(() => 0.5 - Math.random())
      .slice(0, 8);
  }, [allProducts, product]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-pink-600 animate-spin" />
        <p className="text-xs font-bold text-gray-500">Product details load ho rahi hain...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-2xl font-black text-gray-900">Product Not Found</h2>
        <p className="text-xs text-gray-500">
          Yeh item catalogue me uplabdh nahi hai ya delete ho gaya hai.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center space-x-1 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold text-xs rounded-2xl shadow-md"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>
    );
  }

  const productId = product._id || product.id;
  const basePrice = Number(product.price || product.actualPrice || 0);
  const discountPercent = Number(product.discount || 0);
  const finalPrice = calculateFinalPrice(basePrice, discountPercent);
  const savings = basePrice > finalPrice ? (basePrice - finalPrice) * quantity : 0;

  // Image Gallery Controls
  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % imagesList.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + imagesList.length) % imagesList.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 40) handleNextImage();
    if (diff < -40) handlePrevImage();
  };

  // Add to Cart
  const handleAddToCart = () => {
    addToCart(
      {
        ...product,
        id: productId,
        _id: productId,
        image: imagesList[0],
        quantity,
        finalPrice
      },
      quantity
    );
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 2200);
  };

  // Direct Buy Now Bypass
  const handleBuyNow = () => {
    const buyItem = {
      ...product,
      id: productId,
      _id: productId,
      image: imagesList[0],
      quantity,
      finalPrice,
      total: finalPrice * quantity
    };

    if (typeof setCheckoutItem === "function") {
      setCheckoutItem(buyItem);
    }
    sessionStorage.setItem("direct_checkout_item", JSON.stringify(buyItem));
    localStorage.setItem("direct_checkout_item", JSON.stringify(buyItem));
    navigate("/payment");
  };

  const remainingPhotosCount = Math.max(0, imagesList.length - (activeImageIndex + 1));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-24 md:pb-10">
      {/* 1. Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-gray-500">
        <Link to="/" className="hover:text-pink-600 transition">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-pink-600 transition">Products</Link>
        <span>/</span>
        <span className="text-violet-600 font-bold">{product.category || "Item"}</span>
        <span>/</span>
        <span className="text-gray-900 truncate max-w-[200px] sm:max-w-xs font-bold">
          {product.name}
        </span>
      </nav>

      {/* 2. Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ======================================================== */}
        {/* LEFT: MULTI-IMAGE GALLERY (7 Cols)                       */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-24">
          
          {/* Main Visual Image Stage with Integrated Controls */}
          <div
            className="relative w-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm aspect-square group select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={getImageUrl(imagesList[activeImageIndex])}
              alt={`${product.name} Preview ${activeImageIndex + 1}`}
              className="w-full h-full object-contain p-2 sm:p-4 transition-transform duration-500 group-hover:scale-105"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = fallbackImg;
              }}
            />

            {/* Top Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20">
              {discountPercent > 0 && (
                <span className="bg-gradient-to-r from-pink-500 to-rose-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-md uppercase tracking-wider">
                  {discountPercent}% OFF
                </span>
              )}
              {product.isTrending && (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                  Trending Pick 🔥
                </span>
              )}
            </div>

            {/* Total Photo Counter Badge */}
            <span className="absolute top-4 right-4 z-20 bg-slate-900/75 backdrop-blur-md text-white font-bold text-[11px] px-3 py-1 rounded-full shadow-sm">
              {activeImageIndex + 1} / {imagesList.length} Photos
            </span>

            {/* Remaining Photos Quick-Switch Button (Direct on Image) */}
            {imagesList.length > 1 && remainingPhotosCount > 0 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute bottom-4 right-4 z-20 bg-white/90 hover:bg-white text-slate-900 backdrop-blur-md font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-lg flex items-center space-x-1.5 active:scale-95 transition cursor-pointer"
                title="View Next Remaining Image"
              >
                <Layers className="w-3.5 h-3.5 text-pink-600" />
                <span>+{remainingPhotosCount} More</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {/* Left & Right Navigation Arrows */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 text-slate-800 shadow-xl border border-gray-100 flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90 transition-all cursor-pointer hover:bg-pink-600 hover:text-white"
                  title="Previous image"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/95 text-slate-800 shadow-xl border border-gray-100 flex items-center justify-center opacity-80 sm:opacity-0 group-hover:opacity-100 active:scale-90 transition-all cursor-pointer hover:bg-pink-600 hover:text-white"
                  title="Next image"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Interactive Progress Indicator Dots */}
            {imagesList.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full">
                {imagesList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`rounded-full transition-all cursor-pointer ${
                      activeImageIndex === idx
                        ? "bg-gradient-to-r from-pink-500 to-amber-400 w-4 h-1.5"
                        : "bg-white/50 hover:bg-white w-1.5 h-1.5"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Interactive Thumbnails Row with Active Indicator */}
          {imagesList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {imagesList.map((img, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 bg-white transition-all shrink-0 p-1 cursor-pointer ${
                    activeImageIndex === index
                      ? "border-pink-600 ring-4 ring-pink-500/20 scale-105 shadow-md"
                      : "border-gray-200 hover:border-gray-300 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = fallbackImg;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT: BUY BOX & SUMMARY (5 Cols)                        */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-sm space-y-6">
          
          {/* Header & Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
                {product.category || "Store Pick"}
              </span>
              <div className="flex items-center space-x-1.5 text-xs">
                <div className="flex items-center space-x-1 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md font-black">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{product.rating ? Number(product.rating).toFixed(1) : "4.5"}</span>
                </div>
                <span className="text-gray-400 font-semibold">(Verified Review)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center space-x-2 pt-1">
              {product.stock > 0 ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready to Dispatch ({product.stock} units left)</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">
                  Sold Out
                </span>
              )}
            </div>
          </div>

          {/* High-Impact Price & Savings Box */}
          <div className="bg-gradient-to-r from-pink-50/70 via-purple-50/50 to-transparent p-5 rounded-3xl border border-pink-100/70 space-y-2">
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl sm:text-4xl font-black text-gray-900 font-mono tracking-tight">
                ₹{finalPrice.toLocaleString()}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-base sm:text-lg text-gray-400 line-through font-bold font-mono">
                    ₹{basePrice.toLocaleString()}
                  </span>
                  <span className="px-2.5 py-1 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs rounded-xl shadow-sm uppercase tracking-wider">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            {savings > 0 && (
              <p className="text-xs font-black text-emerald-600">
                🎉 Total Savings: ₹{savings.toLocaleString()} on this order!
              </p>
            )}
            <p className="text-[11px] text-gray-400 font-medium">
              Inclusive of all taxes & doorstep delivery
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center justify-between py-2 border-y border-gray-100 text-xs">
            <span className="font-extrabold text-gray-700">Quantity Select:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-sm">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-3.5 py-1.5 hover:bg-gray-200 font-bold text-gray-600 transition cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-4 py-1.5 font-black bg-white text-gray-900 border-x border-gray-100 text-xs">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => (product.stock ? Math.min(product.stock, q + 1) : q + 1))
                }
                className="px-3.5 py-1.5 hover:bg-gray-200 font-bold text-gray-600 transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Action Dual Buttons */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
              className="w-full py-4 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black rounded-2xl flex items-center justify-center space-x-2 text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 active:scale-98 transition cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Instant Buy (₹{(finalPrice * quantity).toLocaleString()})</span>
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full py-3.5 border-2 border-violet-600 text-violet-700 hover:bg-violet-50 font-bold rounded-2xl flex items-center justify-center space-x-2 text-xs uppercase tracking-wider active:scale-98 transition cursor-pointer disabled:opacity-50"
            >
              {isAddedToast ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600 font-black">Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Assurances Badges */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 text-center">
            <div className="p-2.5 bg-gray-50 rounded-2xl space-y-1">
              <Truck className="w-4 h-4 text-violet-600 mx-auto" />
              <p className="text-[10px] font-bold text-gray-800">Free Delivery</p>
              <p className="text-[9px] text-gray-400">Within 2-4 days</p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl space-y-1">
              <RotateCcw className="w-4 h-4 text-pink-600 mx-auto" />
              <p className="text-[10px] font-bold text-gray-800">7 Days Return</p>
              <p className="text-[9px] text-gray-400">Hassle-free UPI</p>
            </div>
            <div className="p-2.5 bg-gray-50 rounded-2xl space-y-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mx-auto" />
              <p className="text-[10px] font-bold text-gray-800">100% Genuine</p>
              <p className="text-[9px] text-gray-400">Brand Warranty</p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. EXTENDED SPECIFICATIONS & DESCRIPTION TABS            */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center space-x-4 border-b border-gray-100 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("description")}
            className={`flex items-center space-x-2 pb-2 text-sm font-black transition relative cursor-pointer ${
              activeTab === "description" ? "text-pink-600" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Product Description</span>
            {activeTab === "description" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-pink-600 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("policy")}
            className={`flex items-center space-x-2 pb-2 text-sm font-black transition relative cursor-pointer ${
              activeTab === "policy" ? "text-pink-600" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Shipping & Warranty Policy</span>
            {activeTab === "policy" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-pink-600 rounded-full" />
            )}
          </button>
        </div>

        {activeTab === "description" ? (
          <div className="space-y-4">
            <h3 className="text-base font-black text-gray-900">
              Detailed Specifications & Information
            </h3>
            <div className="bg-gray-50/70 p-5 sm:p-6 rounded-2xl border border-gray-100 text-sm leading-relaxed whitespace-pre-line text-gray-700 font-normal">
              {product.description ||
                "High quality verified product direct from warehouse with full brand warranty."}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-600">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center space-x-1.5">
                <Truck className="w-4 h-4 text-violet-600" />
                <span>Pan-India Dispatch</span>
              </h4>
              <p>
                Sabhi orders 24 ghante ke andar warehouse se dispatch hote hain. SMS ke zariye real-time tracking link deliver kiya jata hai.
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
              <h4 className="font-bold text-gray-900 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Easy Replacements & Refund</span>
              </h4>
              <p>
                Delivery ke 7 dino ke andar kisi bhi manufacturing issue par free doorstep pickup aur instant UPI refund initiate hota hai.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4. Recommendation Carousel */}
      {relatedRandomProducts.length > 0 && (
        <div className="pt-2">
          

<ProductCarousel
            title="Customers Also Viewed"
            subtitle="Explore Similar Recommendations"
            items={relatedRandomProducts}
          />
        </div>
      )}

      {/* 5. Mobile Fixed Bottom Floating Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <span className="block text-[10px] text-gray-400 font-bold uppercase">
            Payable Amount
          </span>
          <span className="text-lg font-black text-gray-900">
            ₹{(finalPrice * quantity).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center space-x-2 flex-1 max-w-[240px]">
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-2.5 border border-violet-600 text-violet-700 rounded-xl text-xs font-bold"
          >
            {isAddedToast ? "Added" : "Cart"}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-xl text-xs font-black shadow-md shadow-pink-500/20"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}