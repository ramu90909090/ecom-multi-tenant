import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Flame,
  Zap,
  Tag,
  ShieldCheck
} from "lucide-react";
import { getImageUrl } from "../utils/productUtils";

// Default Curated High-Res Slides (Fallback & Variety Pool)
const DEFAULT_HERO_SLIDES = [
  {
    id: "hero-1",
    badge: "Direct Warehouse Dispatch",
    badgeColor: "from-amber-400 to-orange-500",
    titlePrefix: "Next-Gen Audio &",
    titleHighlight: "Smart Gadgets",
    desc: "Experience high-fidelity wireless sound aur active noise cancellation at direct-to-consumer prices.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    tagText: "Up to 45% OFF",
    link: "/products?category=Electronics",
    btnText: "Shop Audio Gear"
  },
  {
    id: "hero-2",
    badge: "Curated Style Edit 2026",
    badgeColor: "from-pink-500 to-rose-600",
    titlePrefix: "Premium Lifestyle &",
    titleHighlight: "Luxury Streetwear",
    desc: "100% genuine breathable fabrics aur modern fits designed for pan-India trends.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    tagText: "Trending Drops",
    link: "/products?category=Fashion",
    btnText: "Explore Wardrobe"
  },
  {
    id: "hero-3",
    badge: "Flagship Precision",
    badgeColor: "from-blue-500 to-cyan-500",
    titlePrefix: "Smart Fitness &",
    titleHighlight: "AMOLED Watches",
    desc: "Real-time health monitoring, Bluetooth calling aur 7-day extended battery life.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
    tagText: "Verified Warranty",
    link: "/products",
    btnText: "View Watches"
  },
  {
    id: "hero-4",
    badge: "Active Performance",
    badgeColor: "from-emerald-500 to-teal-600",
    titlePrefix: "Cushioned Comfort",
    titleHighlight: "Athletic Sneakers",
    desc: "Ergonomic arch support aur ultra-light rubber outsoles everyday running ke liye.",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    tagText: "Best Value",
    link: "/products?category=Footwear",
    btnText: "Shop Footwear"
  },
  {
    id: "hero-5",
    badge: "Home & Modern Living",
    badgeColor: "from-violet-500 to-purple-600",
    titlePrefix: "Aesthetic Decors &",
    titleHighlight: "Workspace Upgrades",
    desc: "Minimalist lighting aur desk accessories jo aapke daily routine ko elevate karein.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
    tagText: "New Arrivals",
    link: "/products?category=Home",
    btnText: "Discover Living"
  }
];

export default function HeroCarousel({ products = [], storeName = "KHASTORE" }) {
  const [slides, setSlides] = useState(DEFAULT_HERO_SLIDES);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch Swipe Refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Randomize & Build 5 Interactive Slides on Component Mount/Refresh
  useEffect(() => {
    let pool = [...DEFAULT_HERO_SLIDES];

    // Agar backend me live products hain, toh unme se image wale products add karein
    if (products && products.length > 0) {
      const productSlides = products
        .filter((p) => (p.images && p.images.length > 0) || p.image)
        .slice(0, 5)
        .map((p, i) => {
          const imgUrl = p.images?.[0]?.url || p.images?.[0] || p.image;
          return {
            id: `prod-${p._id || p.id || i}`,
            badge: p.isTrending ? "Trending Best Seller" : "Direct From Warehouse",
            badgeColor: p.isTrending ? "from-orange-500 to-amber-500" : "from-violet-600 to-pink-600",
            titlePrefix: p.name?.slice(0, 24) || "Premium Selection",
            titleHighlight: `${p.discount ? `${p.discount}% Off` : "Verified Deal"}`,
            desc: p.description?.slice(0, 110) || "Authentic quality assured with express delivery.",
            image: getImageUrl(imgUrl),
            tagText: p.price ? `₹${(p.finalPrice || p.price).toLocaleString()}` : "Special Price",
            link: `/product/${p._id || p.id}`,
            btnText: "Buy Now"
          };
        });

      pool = [...productSlides, ...DEFAULT_HERO_SLIDES];
    }

    // Shuffle Array Randomly
    const shuffled = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
    setSlides(shuffled);
  }, [products]);

  // Autoplay Slider Loop (every 5 seconds)
  useEffect(() => {
    if (isPaused || slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  // Touch Handling for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();
  };

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-950 text-white select-none group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides Viewport */}
      <div className="relative h-[420px] sm:h-[480px] lg:h-[500px] w-full overflow-hidden">
        {slides.map((slide, index) => {
          const isActive = index === current;
          return (
            <div
              key={slide.id || index}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              {/* Background Cover Image with Modern Ambient Overlays */}
              <img
                src={slide.image}
                alt={slide.titlePrefix}
                className="w-full h-full object-cover object-center transform scale-105 group-hover:scale-100 transition-transform duration-1000"
                onError={(e) => {
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80";
                }}
              />

              {/* Dark Gradient Glass Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent lg:w-3/4" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent sm:hidden" />

              {/* Slide Content Box */}
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-16 max-w-2xl z-20 space-y-4 sm:space-y-5">
                {/* Micro Badge */}
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-black uppercase tracking-wider w-fit">
                  <span
                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${slide.badgeColor || "from-pink-500 to-amber-400"} animate-pulse`}
                  />
                  <span className="text-pink-300 font-mono text-[11px]">{slide.badge}</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                  {slide.titlePrefix} <br />
                  <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                    {slide.titleHighlight}
                  </span>
                </h1>

                {/* Subtitle Description */}
                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-lg leading-relaxed font-normal">
                  {slide.desc}
                </p>

                {/* Tag Pill & CTA Action */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Link
                    to={slide.link || "/products"}
                    className="inline-flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-pink-500/25 active:scale-95 transition"
                  >
                    <span>{slide.btnText || "Explore Catalog"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <span className="px-3.5 py-2.5 bg-white/15 backdrop-blur-md border border-white/20 text-amber-300 rounded-2xl text-xs font-black tracking-wide">
                    {slide.tagText}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slider Left / Right Navigation Buttons */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg active:scale-90"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-2xl bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-lg active:scale-90"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Interactive Dots / Progress Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center space-x-2 bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              current === i
                ? "w-7 h-2 bg-gradient-to-r from-pink-500 to-amber-400 shadow-sm"
                : "w-2 h-2 bg-white/40 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}