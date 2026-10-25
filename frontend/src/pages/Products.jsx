import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  Star,
  X,
  RotateCcw,
  Sparkles,
  ChevronDown,
  Tag,
  ArrowUpDown,
  PackageX
} from "lucide-react";
import API from "../api/axios";
import { calculateFinalPrice } from "../utils/productUtils";
import ProductCard from "../components/ProductCard";
import ProductCarousel from "../components/ProductCarousel";

export default function Products() {
  const [productsList, setProductsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("featured");
  const [viewMode, setViewMode] = useState("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const categories = ["All", "Electronics", "Fashion", "Footwear", "Home", "Accessories"];

  // 1. Fetch Dynamic Products from Multi-tenant Backend
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setLoading(true);
        const res = await API.get("/products");
        if (res.data?.success && res.data.data) {
          setProductsList(res.data.data);
        }
      } catch (err) {
        console.warn("Products catalog load fallback:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  // 2. Randomized Products for Carousel on Every Refresh / Load
  const carouselRandomProducts = useMemo(() => {
    if (!productsList || productsList.length === 0) return [];
    return [...productsList].sort(() => 0.5 - Math.random()).slice(0, 8);
  }, [productsList]);

  // Check if user is actively searching or applying filters
  const isFilteringOrSearching = useMemo(() => {
    return (
      searchTerm.trim() !== "" ||
      selectedCategory !== "All" ||
      maxPrice < 5000 ||
      minRating > 0
    );
  }, [searchTerm, selectedCategory, maxPrice, minRating]);

  // 3. Combined Filter, Search & Related Products Sorting Logic
  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    // Base Filter Match Check (Price Range, Min Rating)
    let list = productsList.filter((prod) => {
      const finalPrice = calculateFinalPrice(prod.price, prod.discount);
      const matchesPrice = finalPrice <= maxPrice;
      const matchesRating = (prod.rating || 0) >= minRating;
      return matchesPrice && matchesRating;
    });

    // If searching with keywords
    if (query !== "") {
      const exactMatches = [];
      const relatedMatches = [];

      list.forEach((prod) => {
        const name = (prod.name || "").toLowerCase();
        const cat = (prod.category || "").toLowerCase();
        const desc = (prod.description || "").toLowerCase();

        const isDirectMatch = name.includes(query) || cat.includes(query);
        const isDescMatch = desc.includes(query);

        if (isDirectMatch) {
          exactMatches.push(prod);
        } else if (isDescMatch) {
          relatedMatches.push(prod);
        }
      });

      // Agar direct matches mile, to unhi ki category ke baaki products ko related me shamil karein
      if (exactMatches.length > 0) {
        const matchedCategories = new Set(exactMatches.map((p) => p.category));
        list.forEach((prod) => {
          if (
            matchedCategories.has(prod.category) &&
            !exactMatches.some((m) => (m._id || m.id) === (prod._id || prod.id)) &&
            !relatedMatches.some((m) => (m._id || m.id) === (prod._id || prod.id))
          ) {
            relatedMatches.push(prod);
          }
        });
      }

      // Filter by category if explicitly picked
      if (selectedCategory !== "All") {
        return [...exactMatches, ...relatedMatches].filter(
          (p) => p.category === selectedCategory
        );
      }

      return [...exactMatches, ...relatedMatches];
    }

    // If not searching with keyword, apply category filter directly
    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Regular Sorting
    if (sortBy === "price-low") {
      list.sort(
        (a, b) =>
          calculateFinalPrice(a.price, a.discount) - calculateFinalPrice(b.price, b.discount)
      );
    } else if (sortBy === "price-high") {
      list.sort(
        (a, b) =>
          calculateFinalPrice(b.price, b.discount) - calculateFinalPrice(a.price, a.discount)
      );
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "discount") {
      list.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    return list;
  }, [productsList, searchTerm, selectedCategory, maxPrice, minRating, sortBy]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setMaxPrice(5000);
    setMinRating(0);
    setSortBy("featured");
  };

  const activeFiltersCount = [
    selectedCategory !== "All",
    maxPrice < 5000,
    minRating > 0,
    searchTerm.trim() !== ""
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Search Bar & Quick Controls (Header Banner Removed) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Smart Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by title, keyword, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 focus:border-pink-500 rounded-2xl text-xs sm:text-sm transition-all focus:outline-none focus:ring-4 focus:ring-pink-500/10 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Price Slider & Controls */}
          <div className="flex flex-wrap items-center justify-between w-full md:w-auto gap-3">
            
            {/* Desktop Quick Price Slider */}
            <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200 text-xs">
              <Tag className="w-3.5 h-3.5 text-pink-600 shrink-0" />
              <span className="font-bold text-gray-700 whitespace-nowrap">Max Price:</span>
              <span className="font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md font-mono">
                ₹{maxPrice.toLocaleString()}
              </span>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="accent-pink-600 w-28 sm:w-36 cursor-pointer ml-1"
              />
            </div>

            {/* Mobile Filters Trigger */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-pink-500/20 active:scale-95 transition cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-pink-600 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sorting */}
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 absolute left-3 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 pl-8 pr-8 py-2.5 rounded-2xl text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer hover:bg-gray-100/70 transition"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Customer Rated</option>
                <option value="discount">Biggest Discount</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Grid / List Mode */}
            <div className="hidden sm:flex items-center space-x-1 bg-gray-100 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === "grid" ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  viewMode === "list" ? "bg-white text-pink-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Active Notification Pill */}
        {searchTerm.trim() && (
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="font-bold text-gray-700">
              Showing search & related products for: <span className="text-pink-600 font-black">"{searchTerm}"</span> ({filteredProducts.length} items)
            </span>
            <button
              onClick={() => setSearchTerm("")}
              className="text-pink-600 hover:underline font-bold cursor-pointer"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>

      {/* 2. Randomized Product Carousel (Search or Filter Active Hone Par Automatically Hide Ho Jayega) */}
      {!isFilteringOrSearching && carouselRandomProducts.length > 0 && (
        <section className="animate-in fade-in duration-300">
          

<ProductCarousel
            title="Curated Random Drops"
            subtitle="Fresh Highlights On Every Refresh"
            items={carouselRandomProducts}
          />
        </section>
      )}

      {/* 3. Products Grid + Desktop Sticky Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Sticky Desktop Filter Sidebar */}
        <aside className="hidden lg:block bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-24 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-pink-600" />
              <h2 className="font-black text-gray-900 text-sm">Filter Criteria</h2>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="flex items-center space-x-1 text-xs text-pink-600 hover:text-pink-700 font-bold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2.5">
              Categories
            </label>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-gradient-to-r from-violet-600 to-pink-500 text-white shadow-md shadow-pink-500/20 translate-x-1"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span>{cat}</span>
                  <Tag className={`w-3 h-3 ${selectedCategory === cat ? "text-white" : "text-gray-400"}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Range Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
                Max Price
              </label>
              <span className="text-xs font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md font-mono">
                ₹{maxPrice.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="500"
              max="10000"
              step="100"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-pink-600 h-2 bg-gray-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
              <span>₹500</span>
              <span>₹10,000</span>
            </div>
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
              Minimum Rating
            </label>
            <div className="space-y-1.5">
              {[4, 3, 2, 0].map((star) => (
                <button
                  key={star}
                  onClick={() => setMinRating(star)}
                  className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                    minRating === star
                      ? "border-amber-400 bg-amber-50/50 text-amber-800 font-bold shadow-sm"
                      : "border-gray-100 hover:border-gray-200 text-gray-600"
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{star === 0 ? "All Ratings" : `${star} Stars & Above`}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Product Items Display Area */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing <strong className="text-gray-900">{filteredProducts.length}</strong> {searchTerm.trim() ? "search & related" : ""} products
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-gray-400">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm space-y-3">
              <PackageX className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-black text-gray-900">Koi Product Match Nahi Hua</h3>
              <p className="text-xs text-gray-500">
                Price range slider ko increase karein ya doosra search term try karein[cite: 5, 8].
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 inline-flex items-center space-x-1.5 bg-gradient-to-r from-violet-600 to-pink-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All Filters</span>
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                  : "flex flex-col space-y-4"
              }
            >
              {filteredProducts.map((product) => (
                <div
                  key={product._id || product.id}
                  className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-2xl"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 4. Mobile Slide-Over Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="w-4/5 max-w-sm bg-white h-full p-6 shadow-2xl overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-4 h-4 text-pink-600" />
                  <h3 className="font-black text-base text-gray-900">Filter Products</h3>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Category Grid */}
              <div>
                <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold text-center border transition cursor-pointer ${
                        selectedCategory === c
                          ? "bg-pink-600 text-white border-pink-600 shadow-md"
                          : "border-gray-200 text-gray-700 bg-gray-50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price Range Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
                    Max Price
                  </label>
                  <span className="text-xs font-black text-pink-600 font-mono">
                    ₹{maxPrice.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="10000"
                  step="100"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-pink-600 cursor-pointer"
                />
              </div>

              {/* Mobile Rating */}
              <div>
                <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="space-y-1.5">
                  {[4, 3, 2, 0].map((star) => (
                    <button
                      key={star}
                      onClick={() => setMinRating(star)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                        minRating === star
                          ? "border-amber-400 bg-amber-50 text-amber-800 font-bold"
                          : "border-gray-200 text-gray-700"
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{star === 0 ? "All Ratings" : `${star} Stars & Above`}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 space-y-2">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold rounded-xl text-sm shadow-md active:scale-95 cursor-pointer"
              >
                Apply Filters ({filteredProducts.length})
              </button>
              <button
                onClick={() => {
                  resetFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}