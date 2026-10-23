import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HeroCarousel({ heroData, storeName = "KHASTORE" }) {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-12 my-6 shadow-xl">
      <div className="max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-indigo-200 mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          {heroData?.badge || "Direct Warehouse Delivery"}
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-4">
          {heroData?.headingPrefix || "Welcome to"} <span className="text-amber-400">{heroData?.headingHighlight || storeName}</span>
        </h1>
        <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed mb-6 font-normal">
          {heroData?.description || "Authentic tech gadgets, curated fashion wear aur everyday upgrades direct fair price par deliver hote hain."}
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition"
        >
          Explore Collection <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}