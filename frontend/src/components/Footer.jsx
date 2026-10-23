import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  MapPin,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Sparkles,
  Heart
} from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import { getImageUrl } from "../utils/productUtils";

export default function Footer() {
  const { settings, tenant } = useSettings();
  const f = settings?.footer;
  const storeName = f?.brandName || settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";
  const brandSubtitle = f?.brandSubtitle || settings?.navbar?.brandSubtitle || "Premium Deals 2026";
  const logoUrl = f?.logoUrl || settings?.navbar?.logoUrl;

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setIsSubscribed(true);
    setTimeout(() => {
      setIsSubscribed(false);
      setNewsletterEmail("");
    }, 4000);
  };

  const getTrustIcon = (key) => {
    switch (key) {
      case "truck":
        return <Truck className="w-5 h-5 text-white" />;
      case "shield":
        return <ShieldCheck className="w-5 h-5 text-white" />;
      case "rotate":
        return <RotateCcw className="w-5 h-5 text-white" />;
      default:
        return <Headphones className="w-5 h-5 text-white" />;
    }
  };

  const defaultTrustItems = [
    {
      title: "Free Express Delivery",
      subtitle: "All India over ₹499",
      iconKey: "truck",
      gradient: "from-violet-600 to-indigo-600"
    },
    {
      title: "100% Genuine Items",
      subtitle: "Direct Brand Warranty",
      iconKey: "shield",
      gradient: "from-pink-500 to-rose-600"
    },
    {
      title: "7-Day Free Returns",
      subtitle: "No questions asked",
      iconKey: "rotate",
      gradient: "from-amber-500 to-orange-600"
    },
    {
      title: "Dedicated Support",
      subtitle: "24/7 Fast assistance",
      iconKey: "headphones",
      gradient: "from-emerald-500 to-teal-600"
    }
  ];

  const trustGuarantees = f?.trustGuarantees?.length > 0 ? f.trustGuarantees : defaultTrustItems;

  return (
    <footer className="relative bg-slate-950 text-slate-300 mt-20 overflow-hidden border-t border-slate-900">
      {/* Decorative Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Top Trust Guarantee Bar with Colourful Gradients */}
      <div className="relative border-b border-slate-900/80 bg-slate-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustGuarantees.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3.5 group cursor-default">
                <div
                  className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${
                    item.gradient || "from-violet-600 to-pink-500"
                  } flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shrink-0`}
                >
                  {getTrustIcon(item.iconKey)}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white tracking-tight">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 font-medium">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Main Footer Content Columns */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          
          {/* Brand Col (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center space-x-3 group">
              {logoUrl ? (
                <div className="w-11 h-11 rounded-2xl bg-slate-900 p-1 border border-slate-800 shadow-lg shadow-pink-500/20 group-hover:scale-105 transition-transform">
                  <img src={getImageUrl(logoUrl)} alt={storeName} className="w-full h-full object-contain rounded-xl" />
                </div>
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 p-[2px] shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-pink-400 group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                  {storeName}
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase -mt-0.5">
                  {brandSubtitle}
                </span>
              </div>
            </Link>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm font-normal">
              {f?.description ||
                "Direct factory pricing aur authentic lifestyle & electronic gadgets ka leading online hub. High quality, instant pan-India dispatch ke sath."}
            </p>

            {/* Social Icons (Direct SVGs - Zero Dependency Break) */}
            <div className="pt-2 flex items-center space-x-3">
              <a
                href={f?.socialLinks?.instagram || "https://instagram.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-400 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/20 hover:-translate-y-1 transition duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              <a
                href={f?.socialLinks?.twitter || "https://twitter.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="Twitter / X"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-sky-400 hover:border-sky-500/50 hover:shadow-lg hover:shadow-sky-500/20 hover:-translate-y-1 transition duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href={f?.socialLinks?.youtube || "https://youtube.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:shadow-lg hover:shadow-rose-500/20 hover:-translate-y-1 transition duration-200"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-pink-500 pl-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              {(f?.quickLinks || [
                { label: "Home Page", url: "/" },
                { label: "All Products", url: "/products" },
                { label: "About Us", url: "/about" },
                { label: "Contact Us", url: "/contact" }
              ]).map((link, idx) => (
                <li key={idx}>
                  <Link
                    to={link.url}
                    className="text-slate-400 hover:text-white hover:translate-x-1 inline-block transition duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Desk (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-violet-500 pl-2">
              Customer Desk
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>{f?.customerDesk?.address || "Hazratganj, Lucknow, UP - 226001"}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="w-4 h-4 text-violet-400 shrink-0" />
                <span>{f?.customerDesk?.phone || "+91 98765 43210"}</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">{f?.customerDesk?.email || "support@store.com"}</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Box (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-l-2 border-amber-400 pl-2">
              {f?.newsletter?.title || "Exclusive Offers"}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-normal">
              {f?.newsletter?.subtitle || "Festive discounts aur new drops ki instant notification paayein."}
            </p>

            {isSubscribed ? (
              <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-xs font-bold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Subscribed successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative">
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl pl-4 pr-11 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white rounded-xl flex items-center justify-center shadow-md active:scale-95 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

      {/* 3. Bottom Legal & Payment Badges Strip */}
      <div className="relative border-t border-slate-900 bg-slate-950 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="flex items-center space-x-1.5 text-center sm:text-left">
            <span>{f?.copyrightText || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline-flex items-center text-slate-400 font-medium">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mx-1" /> {f?.heartNotice || "for direct Indian shoppers"}
            </span>
          </p>

          {/* Secure Payment Mode Badges */}
          <div className="flex items-center space-x-2">
            {(f?.paymentModes || ["UPI", "VISA", "MasterCard", "COD"]).map((mode, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider shadow-sm"
              >
                {mode}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}