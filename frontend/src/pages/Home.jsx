import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";
import HeroCarousel from "../components/HeroCarousel";
import {
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Award,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  XCircle,
  PackageX
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";

// Reusable Auto-sliding Section Card Carousel
function SectionCardCarousel({ title, subtitle, badgeText, badgeColor, items = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [isPaused, setIsPaused] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Responsive Items Per View
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

  // Autoplay
  useEffect(() => {
    if (isPaused || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, maxIndex]);

  const handlePrev = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  const handleNext = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));

  if (!items || items.length === 0) return null;

  return (
    <div
      className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-5"
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
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-white shadow-sm ${
              badgeColor || "bg-gradient-to-r from-violet-600 to-pink-600"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{badgeText || "Featured Collection"}</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1.5 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={handlePrev}
            aria-label="Previous Deals"
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:text-pink-600 flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next Deals"
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:text-pink-600 flex items-center justify-center shadow-sm cursor-pointer active:scale-95 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sliding Track */}
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState("featured");

  const storeName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";

  // Category Story Avatars
  const categoryAvatars = [
    { label: "All Items", icon: "✨", cat: "All" },
    { label: "Electronics", icon: "🎧", cat: "Electronics" },
    { label: "Fashion Wear", icon: "👕", cat: "Fashion" },
    { label: "Footwear", icon: "👟", cat: "Footwear" },
    { label: "Home Living", icon: "🏠", cat: "Home" },
    { label: "Accessories", icon: "⌚", cat: "Accessories" }
  ];

  // Fetch Live Products from Multi-tenant Backend
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await API.get("/products");
        if (res.data?.success && res.data.data) {
          // Shuffle array so refresh gives a fresh dynamic feel
          const shuffled = [...res.data.data].sort(() => 0.5 - Math.random());
          setProducts(shuffled);
        }
      } catch (err) {
        console.warn("Home catalog load fallback:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // Filtered Lists for Curated Deal Carousels
  const trendingProducts = useMemo(() => {
    return products.filter((p) => p.isTrending || p.rating >= 4.4);
  }, [products]);

  const offerProducts = useMemo(() => {
    return products
      .filter((p) => (p.discount || 0) >= 20)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }, [products]);

  const bestBuyProducts = useMemo(() => {
    return products.filter((p) => (p.finalPrice || p.price) <= 1500);
  }, [products]);

  // Instant Search Results (Triggered when user is typing)
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return products.filter((p) => {
      const q = searchTerm.toLowerCase();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    });
  }, [products, searchTerm]);

  // Full Catalogue Explorer List
  const filteredProducts = useMemo(() => {
    let result = products.filter((prod) => {
      const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;
      const matchesPrice = (prod.finalPrice || prod.price) <= maxPrice;
      return matchesCategory && matchesPrice;
    });

    if (sortBy === "low-to-high") {
      result.sort((a, b) => (a.finalPrice || a.price) - (b.finalPrice || b.price));
    } else if (sortBy === "high-to-low") {
      result.sort((a, b) => (b.finalPrice || b.price) - (a.finalPrice || a.price));
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [products, selectedCategory, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">

      {/* 1. Category Story Avatar Bubble Strip */}
      <section className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
        {categoryAvatars.map((avatar, idx) => {
          const isSelected = selectedCategory === avatar.cat;
          return (
            <button
              key={idx}
              onClick={() => setSelectedCategory(avatar.cat)}
              className="flex flex-col items-center space-y-1.5 shrink-0 group cursor-pointer focus:outline-none"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] transition-all duration-300 ${
                  isSelected
                    ? "bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 scale-105 shadow-md shadow-pink-500/20"
                    : "bg-gray-200 group-hover:bg-gradient-to-tr group-hover:from-violet-400 group-hover:to-pink-400"
                }`}
              >
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xl sm:text-2xl shadow-inner">
                  {avatar.icon}
                </div>
              </div>
              <span
                className={`text-[11px] font-bold tracking-tight ${
                  isSelected ? "text-pink-600" : "text-gray-600 group-hover:text-gray-900"
                }`}
              >
                {avatar.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* 2. Smart Floating Search Header */}
      <section className="relative">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-100 rounded-3xl p-3 sm:p-4 shadow-xl shadow-pink-500/5 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder={`Search gadgets, sneakers, luxury wear in ${storeName}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-10 py-2.5 bg-gray-50/80 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 border border-gray-100 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>

          <Link
            to="/products"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced Studio</span>
          </Link>
        </div>
      </section>

      {/* 3. INSTANT SEARCH RESULTS BLOCK (Only visible when user types in search) */}
      {searchTerm.trim() && (
        <section className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 space-y-6 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                Live Query Search
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1.5">
                Results for "{searchTerm}" ({searchResults.length})
              </h2>
            </div>
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs font-bold text-slate-500 hover:text-pink-600 underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <PackageX className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">Koi product match nahi hua</p>
              <p className="text-xs text-gray-400">Dusre keywords ya brand name likhkar try karein.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {searchResults.map((product) => (
                <ProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. HERO CAROUSEL (Randomized Banner Images & Products) */}
      <section>
        <HeroCarousel products={products} storeName={storeName} />
      </section>

      {/* 5. Trust Guarantee Bar */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center space-x-3 p-2">
          <Truck className="w-5 h-5 text-violet-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Express Delivery</h4>
            <p className="text-[10px] text-gray-500">Free on orders &gt; ₹499</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">100% Genuine</h4>
            <p className="text-[10px] text-gray-500">Direct Brand Warranty</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-2">
          <RotateCcw className="w-5 h-5 text-pink-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">7-Day Free Return</h4>
            <p className="text-[10px] text-gray-500">Instant UPI refund</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 p-2">
          <Headphones className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-gray-900">Priority Support</h4>
            <p className="text-[10px] text-gray-500">24/7 dedicated desk</p>
          </div>
        </div>
      </section>

      {/* 6. DEDICATED AUTO-SLIDING DEAL CAROUSELS */}
      <div className="space-y-10">
        {/* Carousel 1: Most Trending Drops */}
        {trendingProducts.length > 0 && (
          <SectionCardCarousel
            title="Most Trending & Popular"
            subtitle="Customer ke dwara iss hafte sabse zyada order kiye gaye products"
            badgeText="Trending Now"
            badgeColor="bg-gradient-to-r from-orange-500 to-amber-500"
            items={trendingProducts}
          />
        )}

        {/* Carousel 2: Mega Discounts & Flash Deals */}
        {offerProducts.length > 0 && (
          <SectionCardCarousel
            title="Mega Discounts & Flash Deals"
            subtitle="Exclusive savings - Flat 20% se 50% warehouse off"
            badgeText="Mega Offers"
            badgeColor="bg-gradient-to-r from-pink-500 to-rose-600"
            items={offerProducts}
          />
        )}

        {/* Carousel 3: Best Value Picks Under ₹1,500 */}
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

      {/* 7. ALL PRODUCTS EXPLORER (With Interactive Range & Sorter) */}
      <section className="bg-white/95 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
              Full Catalogue
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-gray-900 mt-2">
              Browse All Products ({filteredProducts.length})
            </h2>
            <p className="text-xs text-gray-500">Live filters ke anuroop updated product list.</p>
          </div>

          {/* Interactive Filters: Price Range & Sorter */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">
                Max: ₹{maxPrice.toLocaleString()}
              </span>
              <input
                type="range"
                min="300"
                max="10000"
                step="200"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="accent-pink-600 w-28 sm:w-36 cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-bold bg-gray-50 border border-gray-200 py-2.5 px-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer"
              >
                <option value="featured">Sort by: Featured</option>
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-400">Loading catalog items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl p-12 text-center border border-gray-100 space-y-3">
            <PackageX className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-base font-black text-gray-800">No items match your filter criteria</p>
            <p className="text-xs text-gray-400">Price slider ko increase karein ya category All karein.</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setMaxPrice(10000);
              }}
              className="px-5 py-2.5 bg-pink-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-pink-700 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}