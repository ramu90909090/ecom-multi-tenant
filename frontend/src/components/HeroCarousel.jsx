import React, { useState, useEffect, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getImageUrl } from "../utils/productUtils";

// Static fallback slides (Tabhi dikhenge jab backend se koi product nahi aayega)
const DEFAULT_HERO_SLIDES = [
  {
    id: "static-1",
    badge: "Direct Warehouse Dispatch",
    badgeColor: "from-amber-400 to-orange-500",
    titlePrefix: "Next-Gen Audio &",
    titleHighlight: "Smart Gadgets",
    desc: "Experience high-fidelity wireless sound aur active noise cancellation at direct-to-consumer prices.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
    tagText: "Up to 45% OFF",
    link: "/products",
    btnText: "Shop Audio Gear"
  },
  {
    id: "static-2",
    badge: "Curated Style Edit 2026",
    badgeColor: "from-pink-500 to-rose-600",
    titlePrefix: "Premium Lifestyle &",
    titleHighlight: "Luxury Streetwear",
    desc: "100% genuine breathable fabrics aur modern fits designed for pan-India trends.",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
    tagText: "Trending Drops",
    link: "/products",
    btnText: "Explore Wardrobe"
  }
];

export default function HeroCarousel({ products = [], autoSlideInterval = 2500 }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Dynamic Slides: Backend se random products pick honge, agar empty hain tabhi static fallback aayega
  const slides = useMemo(() => {
    if (products && products.length > 0) {
      // Backend products ko randomly shuffle karke top 5 items pick karte hain
      const randomized = [...products].sort(() => 0.5 - Math.random()).slice(0, 5);
      return randomized.map((p, idx) => {
        const imgUrl = p.images?.[0]?.url || p.images?.[0] || p.image;
        return {
          id: p._id || p.id || `prod-${idx}`,
          badge: p.isTrending ? "Trending Best Seller" : `${p.category || "Featured"} Collection`,
          badgeColor: "from-violet-600 to-pink-600",
          titlePrefix: p.name || "Exclusive Item",
          titleHighlight: p.discount ? `${p.discount}% OFF` : `₹${p.sellingPrice || p.price || "Deal"}`,
          desc: p.description || "Authentic quality assured with express nationwide shipping.",
          image: getImageUrl(imgUrl),
          tagText: p.sellingPrice ? `₹${p.sellingPrice}` : "Best Offer",
          link: `/products`,
          btnText: "Explore Now"
        };
      });
    }
    // Agar backend empty hai toh static fallback return hoga
    return DEFAULT_HERO_SLIDES;
  }, [products]);

  // Fast Auto-slide Timer
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [isPaused, slides.length, autoSlideInterval]);

  const prevSlide = () => setCurrent(current === 0 ? slides.length - 1 : current - 1);
  const nextSlide = () => setCurrent(current === slides.length - 1 ? 0 : current + 1);

  if (!slides || slides.length === 0) return null;

  return (
    <div
      className="relative w-full h-[240px] sm:h-[340px] md:h-[380px] rounded-3xl overflow-hidden shadow-xl group select-none bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchMove={(e) => { touchEndX.current = e.touches[0].clientX; }}
      onTouchEnd={() => {
        const distance = touchStartX.current - touchEndX.current;
        if (distance > 50) nextSlide();
        if (distance < -50) prevSlide();
      }}
    >
      {slides.map((slide, index) => (
        <div
          key={slide.id || index}
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            index === current ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 pointer-events-none scale-105"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.titlePrefix}
            className="w-full h-full object-cover"
            loading={index === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-slate-950/85 via-slate-900/60 to-transparent" />

          <div className="absolute inset-0 flex flex-col justify-end sm:justify-center p-5 sm:p-8 max-w-xl text-white">
            <span className="inline-flex items-center space-x-1 w-fit px-2.5 py-0.5 bg-white/20 backdrop-blur-md text-amber-300 font-bold text-[10px] uppercase rounded-full mb-1.5 border border-white/20">
              <Sparkles className="w-3 h-3" />
              <span>{slide.badge}</span>
            </span>

            <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight mb-1.5 drop-shadow-md line-clamp-1">
              {slide.titlePrefix}
            </h2>

            <p className="text-pink-300 font-bold text-xs sm:text-sm mb-2">
              {slide.titleHighlight}
            </p>

            <p className="text-slate-200 text-xs sm:text-xs mb-3 line-clamp-2">
              {slide.desc}
            </p>

            <div>
              <Link
                to={slide.link || "/products"}
                className="inline-flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-lg transition"
              >
                <span>{slide.btnText || "Shop Now"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        aria-label="Previous Slide"
        className="hidden group-hover:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/30 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 rounded-full items-center justify-center transition shadow-md cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={nextSlide}
        aria-label="Next Slide"
        className="hidden group-hover:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white/30 backdrop-blur-md hover:bg-white text-white hover:text-slate-900 rounded-full items-center justify-center transition shadow-md cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1.5 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              current === i ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}