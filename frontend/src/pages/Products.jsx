import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import ProductCard from "../components/ProductCard";
import ProductCarousel from "../components/ProductCarousel";
import {
  Search,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Star,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  X
} from "lucide-react";
import { calculateFinalPrice, getImageUrl } from "../utils/productUtils";
import { useCart } from "../context/CartContext";

export default function Products() {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [pageConfig, setPageConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("latest");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = ["All", "Electronics", "Fashion", "Footwear", "Home", "Accessories"];

  // Fetch Products & Dynamic CMS Config on Mount & Filter Change
  const fetchProductsAndConfig = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (category !== "All") query.append("category", category);
      if (search.trim()) query.append("search", search.trim());
      if (maxPrice < 100000) query.append("maxPrice", maxPrice);
      if (minRating > 0) query.append("minRating", minRating);
      if (sortBy) query.append("sortBy", sortBy);

      const [productsRes, configRes] = await Promise.all([
        API.get(`/products?${query.toString()}`),
        API.get("/product-page-cms/config").catch(() => ({ data: { data: null } }))
      ]);

      if (productsRes.data?.data) {
        setProducts(productsRes.data.data);
      }
      if (configRes.data?.data) {
        setPageConfig(configRes.data.data);
      }
    } catch (err) {
      console.error("Products catalog error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndConfig();
  }, [category, maxPrice, minRating, sortBy]);

  const handleResetFilters = () => {
    setSearch("");
    setCategory("All");
    setMaxPrice(100000);
    setMinRating(0);
    setSortBy("latest");
  };

  const isSearching = Boolean(search.trim());

  // Carousel Trending Products
  const trendingProducts = useMemo(() => {
    return products.filter((p) => p.isTrending || p.rating >= 4.5);
  }, [products]);

  const banner = pageConfig?.banner;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Dynamic Product Page CMS Hero Banner */}
      {(!banner || banner.isEnabled !== false) && !isSearching && (
        <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl animate-in fade-in">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{banner?.tagline || "Exclusive Collection 2026"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {banner?.title || "Explore All Products"}
            </h1>
            <p className="text-pink-100 text-xs sm:text-sm max-w-xl">
              {banner?.description ||
                "Curated electronics, top-rated fashion wear, footwear aur home utility essentials direct warehouse discount rates par."}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </section>
      )}

      {/* 2. Top Header & Search Tool */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Store Catalogue
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            100% genuine verified products direct delivery ke sath
          </p>
        </div>

        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search product name, category, brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProductsAndConfig()}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 transition shadow-sm"
            />
          </div>
          <button
            onClick={fetchProductsAndConfig}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-md transition"
          >
            Search
          </button>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* 3. Left Desktop Filter Sidebar */}
        <aside className="hidden md:block w-64 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm shrink-0 h-fit space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-600" />
              <h3 className="font-black text-sm text-slate-900">Filters</h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-3">
              Categories
            </label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                    category === cat
                      ? "bg-indigo-50 text-indigo-600 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{cat}</span>
                  {category === cat && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Max Price
              </label>
              <span className="text-xs font-black text-indigo-600">
                ₹{Number(maxPrice).toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="100000"
              step="500"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              Customer Rating
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[0, 3, 4, 4.5].map((rt) => (
                <button
                  key={rt}
                  onClick={() => setMinRating(rt)}
                  className={`py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    minRating === rt
                      ? "bg-amber-50 border-amber-300 text-amber-700 font-black"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {rt === 0 ? "All" : <>{rt}+ <Star className="w-3 h-3 fill-amber-400 text-amber-400" /></>}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 bg-white focus:outline-none cursor-pointer"
            >
              <option value="latest">Latest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="discount">Highest Discount</option>
            </select>
          </div>
        </aside>

        {/* 4. Mobile Filter Drawer */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
              <div className="space-y-6">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-black text-sm text-slate-900">Filters</h3>
                  <button onClick={() => setIsMobileFilterOpen(false)} className="p-1 text-slate-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-2">Category</label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border text-center ${
                          category === cat
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Max Price</span>
                    <span className="text-indigo-600">₹{maxPrice.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                >
                  Apply
                </button>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Right Products Catalogue (Grid vs List View) */}
        <div className="flex-1">
          {/* Action Header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-500">
              Showing <b>{products.length}</b> items {isSearching && `matching "${search}"`}
            </p>

            {/* Grid / List Mode Toggle */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-800"
                }`}
                title="Grid Mode"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-xl transition cursor-pointer ${
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-800"
                }`}
                title="List Mode"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-3" />
              <p className="text-xs font-bold text-slate-400">Loading catalog items...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
              <p className="text-base font-black text-slate-800 mb-1">No products found</p>
              <p className="text-xs text-slate-400 mb-6">Aapke filter ya search criteria se koi item match nahi hua.</p>
              <button
                onClick={handleResetFilters}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs shadow-md cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <>
              {/* Product Layout: Grid View */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p._id || p.id} product={p} />
                  ))}
                </div>
              ) : (
                /* Product Layout: List View */
                <div className="space-y-4">
                  {products.map((p) => {
                    const id = p._id || p.id;
                    const finalPrice = calculateFinalPrice(p.price || p.sellingPrice, p.discount);
                    const img =
                      Array.isArray(p.images) && p.images.length > 0
                        ? p.images.find((x) => x.isPrimary)?.url || p.images[0]?.url || p.images[0]
                        : p.image;

                    return (
                      <div
                        key={id}
                        className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-center gap-4"
                      >
                        <Link to={`/product/${id}`} className="w-full sm:w-32 h-32 bg-slate-50 rounded-2xl overflow-hidden shrink-0">
                          <img
                            src={getImageUrl(img)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";
                            }}
                          />
                        </Link>
                        <div className="flex-1 w-full">
                          <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {p.category}
                          </span>
                          <Link to={`/product/${id}`} className="block text-sm font-black text-slate-800 hover:text-indigo-600 mt-1 line-clamp-1">
                            {p.name}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mt-2">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{p.rating || 4.5}</span>
                          </div>
                        </div>
                        <div className="sm:border-l sm:border-slate-100 sm:pl-6 text-right w-full sm:w-auto flex sm:flex-col justify-between items-center sm:items-end">
                          <div>
                            <span className="text-lg font-black text-slate-900">₹{finalPrice.toLocaleString()}</span>
                            {p.discount > 0 && (
                              <p className="text-[11px] text-slate-400 line-through">
                                ₹{Number(p.price || p.actualPrice).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => addToCart({ ...p, finalPrice }, 1)}
                            className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" /> Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dynamic Trending Carousel: Jab active search na ho tabhi render hoga */}
              {!isSearching && trendingProducts.length > 0 && (
                <div className="mt-14 pt-8 border-t border-slate-200">
                  

<ProductCarousel
                    title="Frequently Bought & Trending Picks"
                    subtitle="Customer top choices based on reviews"
                    products={trendingProducts.slice(0, 4)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}