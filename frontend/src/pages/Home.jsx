import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "../components/HeroCarousel";
import {
  Sparkles,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  XCircle,
  PackageX,
  SlidersHorizontal
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";

// Reusable Auto-sliding Section Card Carousel
function SectionCardCarousel({ title, subtitle, badgeText, badgeColor, items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1.3);
      else if (window.innerWidth < 1024) setItemsPerView(2.5);
      else setItemsPerView(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, items.length - Math.floor(itemsPerView));

  useEffect(() => {
    if (isPaused || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3200);
    return () => clearInterval(interval);
  }, [isPaused, maxIndex]);

  const handlePrev = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));

  if (!items || items.length === 0) return null;

  return (
    <div
      className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
      onTouchEnd={() => {
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 50) handleNext();
        if (diff < -50) handlePrev();
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
        <div>
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm ${
              badgeColor || "bg-gradient-to-r from-violet-600 to-pink-600"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{badgeText}</span>
          </span>
          <h2 className="text-lg sm:text-xl font-black text-gray-900 mt-1 tracking-tight">
            {title}
          </h2>
          <p className="text-[11px] text-gray-400 font-medium">{subtitle}</p>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:text-pink-600 flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Slide"
            className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:text-pink-600 flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden py-1">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)` }}
        >
          {items.map((prod) => (
            <div
              key={prod._id || prod.id}
              className="shrink-0 px-2 box-border"
              style={{ width: `${100 / itemsPerView}%` }}
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { tenant, settings } = useSettings();
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState("featured");

  const storeName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";

  // Category Story Avatar Bubble Strip
  const categoryAvatars = [
    { label: "All", icon: "✨", cat: "All" },
    { label: "Electronics", icon: "🎧", cat: "Electronics" },
    { label: "Fashion", icon: "👕", cat: "Fashion" },
    { label: "Footwear", icon: "👟", cat: "Footwear" },
    { label: "Home", icon: "🏠", cat: "Home" },
    { label: "Accessories", icon: "⌚", cat: "Accessories" }
  ];

  // Fetch Live Products from Backend API (/products)
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await API.get("/products");
        if (res.data?.success && res.data.data) {
          setRawProducts(res.data.data);
        }
      } catch (err) {
        console.warn("Home catalog load fallback:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Random Shuffled Products
  const products = useMemo(() => {
    if (!rawProducts || rawProducts.length === 0) return [];
    return [...rawProducts].sort(() => 0.5 - Math.random());
  }, [rawProducts]);

  // Filtered Products based on Search Priority & Filters
  const activeFilteredProducts = useMemo(() => {
    let result = products.filter((prod) => {
      const matchesSearch = !searchTerm.trim() || 
        prod.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
      const matchesPrice = (prod.finalPrice || prod.price) <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sortBy === "low-to-high") {
      result.sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price));
    } else if (sortBy === "high-to-low") {
      result.sort((a, b) => (b.finalPrice || b.price) - (a.finalPrice || a.price));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, selectedCategory, maxPrice, searchTerm, sortBy]);

  // Dynamic Carousels Data
  const trendingProducts = useMemo(() => products.filter((p) => p.isTrending || p.rating >= 4.4), [products]);
  const offerProducts = useMemo(() => products.filter((p) => (p.discount || 0) >= 20), [products]);
  const bestBuyProducts = useMemo(() => products.filter((p) => (p.finalPrice || p.price) <= 1500), [products]);

  const isSearchOrFilterActive = searchTerm.trim() !== "" || selectedCategory !== "All";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6">

      {/* ======================================================== */}
      {/* 1. ATTRACTIVE SEARCH BAR & COMPACT FILTER/CATEGORY SECTION */}
      {/* ======================================================== */}
      <section className="bg-white/95 backdrop-blur-xl p-3 sm:p-4 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-3">
        
        {/* Attractive Glowing Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-pink-500 absolute left-4 top-3.5" />
          <input
            type="text"
            placeholder={`🔍 Search in ${storeName} for electronics, fashion, smartwatches...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-gray-50 via-pink-50/30 to-gray-50 border-2 border-pink-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15 rounded-2xl text-xs sm:text-sm font-bold outline-none transition duration-300 shadow-md text-gray-800 placeholder-gray-400"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")} 
              className="absolute right-4 top-3.5 text-gray-400 hover:text-pink-600 transition cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Compact Category Strip & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-gray-100">
          
          {/* Story-Style Visual Category Buttons (Compact Height) */}
          <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-none w-full sm:w-auto">
            {categoryAvatars.map((avatar, idx) => {
              const isSelected = selectedCategory === avatar.cat;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(avatar.cat)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl shrink-0 group cursor-pointer transition-all duration-200 border text-xs font-bold shadow-sm"
                  style={{
                    background: isSelected ? "linear-gradient(135deg, #7c3aed, #db2777)" : "#f9fafb",
                    color: isSelected ? "#ffffff" : "#4b5563",
                    borderColor: isSelected ? "transparent" : "#e5e7eb"
                  }}
                >
                  <span className="text-sm">{avatar.icon}</span>
                  <span>{avatar.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort & Reset Actions */}
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            {isSearchOrFilterActive && (
              <button
                onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}
                className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2.5 py-1.5 rounded-xl hover:bg-pink-100 transition cursor-pointer"
              >
                Reset ✕
              </button>
            )}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-[11px] font-bold bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-xl focus:outline-none cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. SEARCH PRIORITY RESULT GRID (Turant Search ke baad dikhega) */}
      {/* ======================================================== */}
      {isSearchOrFilterActive && (
        <section className="bg-white p-5 sm:p-6 rounded-3xl border border-pink-200 shadow-xl shadow-pink-500/10 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full">
                Priority Search & Filter Results
              </span>
              <h2 className="text-lg font-black text-gray-900 mt-1">
                Matching Products ({activeFilteredProducts.length})
              </h2>
            </div>
            <button
              onClick={() => { setSelectedCategory("All"); setSearchTerm(""); }}
              className="text-xs font-bold text-gray-500 hover:text-pink-600 underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {activeFilteredProducts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <PackageX className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-700">Koi product match nahi hua.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {activeFilteredProducts.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ======================================================== */}
      {/* 3. NORMAL HOME VIEW (Jab search active na ho)             */}
      {/* ======================================================== */}
      {!isSearchOrFilterActive && (
        <>
          {/* Hero Carousel */}
          <section>
            <HeroCarousel products={products} autoSlideInterval={2500} />
          </section>

          {/* Trust Guarantee Bar */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-2.5 p-1.5">
              <Truck className="w-4 h-4 text-violet-600 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-gray-900">Express Delivery</h4>
                <p className="text-[9px] text-gray-500">Free on orders &gt; ₹499</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 p-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-gray-900">100% Genuine</h4>
                <p className="text-[9px] text-gray-500">Brand Warranty</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 p-1.5">
              <RotateCcw className="w-4 h-4 text-pink-600 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-gray-900">7-Day Return</h4>
                <p className="text-[9px] text-gray-500">Instant UPI refund</p>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 p-1.5">
              <Headphones className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-[11px] font-bold text-gray-900">24/7 Support</h4>
                <p className="text-[9px] text-gray-500">Dedicated desk</p>
              </div>
            </div>
          </section>

          {/* Section Carousels */}
          <div className="space-y-8">
            {trendingProducts.length > 0 && (
              <SectionCardCarousel
                title="Most Trending & Popular"
                subtitle="Customer ke dwara iss hafte sabse zyada order kiye gaye products"
                badgeText="Trending Now"
                badgeColor="bg-gradient-to-r from-orange-500 to-amber-500"
                items={trendingProducts}
              />
            )}

            {offerProducts.length > 0 && (
              <SectionCardCarousel
                title="Mega Discounts & Flash Deals"
                subtitle="Exclusive savings - Flat 20% se 50% warehouse off"
                badgeText="Mega Offers"
                badgeColor="bg-gradient-to-r from-pink-500 to-rose-600"
                items={offerProducts}
              />
            )}

            {bestBuyProducts.length > 0 && (
              <SectionCardCarousel
                title="Best Buy Under Budget"
                subtitle="Pocket-friendly prices par high rated genuine picks"
                badgeText="Best Value"
                badgeColor="bg-gradient-to-r from-violet-600 to-indigo-600"
                items={bestBuyProducts}
              />
            )}
          </div>
        </>
      )}

    </div>
  );
}