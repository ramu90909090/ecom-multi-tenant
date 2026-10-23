import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";
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
  Star
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";

export default function Home() {
  const { tenant, settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [aboutConfig, setAboutConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const storeName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";

  // Category Story Avatars
  const categoryAvatars = [
    { label: "All Items", icon: "✨", cat: "All", color: "from-violet-500 to-indigo-500" },
    { label: "Electronics", icon: "🎧", cat: "Electronics", color: "from-blue-500 to-cyan-500" },
    { label: "Fashion Wear", icon: "👕", cat: "Fashion", color: "from-pink-500 to-rose-500" },
    { label: "Footwear", icon: "👟", cat: "Footwear", color: "from-amber-500 to-orange-500" },
    { label: "Home Upgrade", icon: "🏠", cat: "Home", color: "from-emerald-500 to-teal-500" },
    { label: "Accessories", icon: "⌚", cat: "Accessories", color: "from-purple-500 to-violet-500" }
  ];

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [prodRes, aboutRes] = await Promise.all([
          API.get("/products"),
          API.get("/about/config")
        ]);
        if (prodRes.data?.data) setProducts(prodRes.data.data);
        if (aboutRes.data?.data) setAboutConfig(aboutRes.data.data);
      } catch (err) {
        console.error("Home data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Filtered Lists for Auto Deal Carousels
  const trendingList = useMemo(
    () => products.filter((p) => p.isTrending || p.rating >= 4.5),
    [products]
  );

  const flashDealsList = useMemo(
    () => products.filter((p) => p.discount >= 20).sort((a, b) => b.discount - a.discount),
    [products]
  );

  const budgetPicksList = useMemo(
    () => products.filter((p) => (p.finalPrice || p.price) <= 1500),
    [products]
  );

  // Active Catalog Filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, search]);

  const hero = aboutConfig?.hero;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      
      {/* 1. Category Story Avatar Strip */}
      <section className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-none">
        {categoryAvatars.map((avatar, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedCategory(avatar.cat)}
            className="flex flex-col items-center space-y-1.5 shrink-0 group cursor-pointer focus:outline-none"
          >
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[2px] bg-gradient-to-tr ${
                selectedCategory === avatar.cat
                  ? "from-violet-600 via-pink-500 to-amber-400 scale-105 shadow-md shadow-pink-500/20"
                  : "from-gray-200 to-gray-300 group-hover:from-violet-400 group-hover:to-pink-400"
              } transition-all duration-300`}
            >
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-xl sm:text-2xl">
                {avatar.icon}
              </div>
            </div>
            <span
              className={`text-[11px] font-bold tracking-tight ${
                selectedCategory === avatar.cat ? "text-pink-600" : "text-gray-600 group-hover:text-gray-900"
              }`}
            >
              {avatar.label}
            </span>
          </button>
        ))}
      </section>

      {/* 2. Interactive Search & Floating Filter Header */}
      <section className="relative">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-3 sm:p-4 shadow-xl shadow-pink-500/5 flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder={`Search gadgets, fashion or products in ${storeName}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50/80 rounded-2xl text-xs sm:text-sm font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-pink-500/20 border border-gray-100 transition"
            />
          </div>
          <Link
            to="/products"
            className="px-5 py-2.5 bg-slate-900 hover:bg-gray-800 text-white rounded-2xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Advanced Filters</span>
          </Link>
        </div>
      </section>

      {/* 3. Hero Showcase Banner (Only when NOT actively searching) */}
      {!search.trim() && (
        <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-8 sm:p-14 text-white shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{hero?.badge || "Direct Warehouse Express Delivery"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {hero?.headingPrefix || "Humara Maqsad:"}{" "}
              <span className="text-amber-200">{hero?.headingHighlight || storeName}</span>
            </h1>
            <p className="text-pink-100 text-xs sm:text-sm leading-relaxed max-w-xl font-normal">
              {hero?.description ||
                "Authentic electronics, lifestyle wear aur everyday upgrades direct fair warehouse price par deliver hote hain. Koi extra hidden commission nahi."}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-slate-950 hover:bg-black text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg transition active:scale-95"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4 text-pink-400" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider border border-white/30 transition"
              >
                <span>About Our Hub</span>
              </Link>
            </div>
          </div>
          {/* Ambient Glow */}
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none" />
        </section>
      )}

      {/* 4. Auto-sliding Card-enclosed Deals (Trending, Super Deals & Budget) */}
      {!search.trim() && (
        <div className="space-y-12">
          
          {/* Deal Section 1: Trending Products */}
          {trendingList.length > 0 && (
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Flame className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                      Trending Products Right Now
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold">Customer top picks & highly rated drops</p>
                  </div>
                </div>
                <Link
                  to="/products?filter=trending"
                  className="text-xs font-bold text-pink-600 hover:text-violet-600 flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {trendingList.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Deal Section 2: Flash Offers / Super Deals */}
          {flashDealsList.length > 0 && (
            <section className="bg-gradient-to-br from-pink-500/5 via-violet-500/5 to-transparent p-6 sm:p-8 rounded-3xl border border-pink-100/60 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-pink-500/20">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                      Flash Deals & Super Discounts
                    </h2>
                    <p className="text-xs text-pink-600 font-bold">Flat 20% to 50% Off direct warehouse stock</p>
                  </div>
                </div>
                <Link
                  to="/products?sortBy=discount"
                  className="text-xs font-bold text-pink-600 hover:text-violet-600 flex items-center space-x-1"
                >
                  <span>Explore Offers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {flashDealsList.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Deal Section 3: Budget Value Picks */}
          {budgetPicksList.length > 0 && (
            <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                      Pocket Friendly Deals Under ₹1,500
                    </h2>
                    <p className="text-xs text-gray-400 font-semibold">Everyday upgrades with maximum value</p>
                  </div>
                </div>
                <Link
                  to="/products?maxPrice=1500"
                  className="text-xs font-bold text-emerald-600 hover:underline flex items-center space-x-1"
                >
                  <span>See Budget Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {budgetPicksList.slice(0, 4).map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* 5. Main All Products Explorer */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {search.trim() ? `Search Results for "${search}"` : `All Verified Products (${selectedCategory})`}
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Showing {filteredProducts.length} items from {storeName} catalogue
            </p>
          </div>
          {selectedCategory !== "All" && (
            <button
              onClick={() => setSelectedCategory("All")}
              className="text-xs font-bold text-pink-600 hover:underline self-start sm:self-auto"
            >
              Reset to All Categories
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-400">Loading live items...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 space-y-3">
            <p className="text-base font-black text-gray-800">No products match your criteria</p>
            <p className="text-xs text-gray-400">Try changing keywords or resetting category filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("All");
              }}
              className="px-5 py-2.5 bg-pink-600 text-white rounded-2xl text-xs font-bold shadow-md hover:bg-pink-700 transition"
            >
              Clear All Filters
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