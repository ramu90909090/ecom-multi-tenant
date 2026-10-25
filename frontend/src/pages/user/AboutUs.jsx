import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Truck,
  Award,
  Users,
  Building2,
  Sparkles,
  HeartHandshake,
  CheckCircle,
  ArrowRight,
  Store,
  Boxes,
  Mail,
  Clock,
  Layers,
  ChevronRight
} from "lucide-react";
import API from "../../api/axios";
import { useSettings } from "../../context/SettingsContext";

// Dynamic Pillar Icon Map
const PILLAR_ICON_MAP = {
  ShieldCheck,
  Truck,
  Award,
  HeartHandshake,
  Store,
  Boxes,
  Building2
};

// Reusable Counter Hook: 0 se target number tak smoothly count-up karta hai
function useCounter(targetValue, start = false, duration = 1800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTimestamp = null;
    const numericTarget = Number(targetValue) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * numericTarget));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [targetValue, start, duration]);

  return count;
}

// Interactive Animated Stat Card with Gradient Glow
function AnimatedStatCard({ stat, isVisible }) {
  const count = useCounter(stat.number, isVisible, 2000);

  return (
    <div className="group relative bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 text-center hover:-translate-y-2 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      <h3 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent font-mono">
        {stat.prefix || ""}
        {stat.isDecimal ? (count / 10).toFixed(1) : count.toLocaleString()}
        {stat.suffix || "+"}
      </h3>
      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-2">{stat.label}</p>
      {stat.change && (
        <span className="inline-block text-[11px] font-semibold text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full mt-2">
          {stat.change}
        </span>
      )}
    </div>
  );
}

export default function AboutUs() {
  const { tenant } = useSettings();
  const [config, setConfig] = useState(null);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);

  // 1. Fetch Dynamic Multi-Tenant About Us CMS Data
  useEffect(() => {
    API.get("/about/config")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setConfig(res.data.data);
        }
      })
      .catch((err) => {
        console.warn("About CMS load fallback:", err.message);
      });
  }, []);

  // 2. Observer for Stats Number Counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsInView(true);
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) observer.observe(statsRef.current);

    const safetyTimer = setTimeout(() => setStatsInView(true), 500);
    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  const storeTitle = tenant?.storeName || "KHASTORE";

  // Fallback defaults
  const defaultStats = [
    { number: 75000, suffix: "+", label: "Delivered Orders", change: "Pan-India Reach" },
    { number: 120, suffix: "+", label: "Genuine Brands", change: "Direct OEM Partners" },
    { number: 48, isDecimal: true, suffix: " ★", label: "Customer Rating", change: "Verified Reviews" },
    { number: 24, prefix: "< ", suffix: " Hrs", label: "Dispatch Speed", change: "Express Logistics" }
  ];

  const defaultPillars = [
    {
      icon: "ShieldCheck",
      title: "100% Genuine Brands",
      color: "from-blue-500 to-cyan-500",
      desc: "Direct OEM tie-ups bina kisi middleman ya fake products ke risk ke."
    },
    {
      icon: "Truck",
      title: "Lightning Fast Dispatch",
      color: "from-pink-500 to-rose-500",
      desc: "Advanced packaging aur 24 ghante ke andar direct courier partner handover."
    },
    {
      icon: "Award",
      title: "Multi-Tier Quality Check",
      color: "from-amber-500 to-orange-500",
      desc: "Har product dispatch hone se pehle 4 physical quality checks se guzarta hai."
    },
    {
      icon: "HeartHandshake",
      title: "Customer-First Support",
      color: "from-violet-500 to-indigo-500",
      desc: "Hassle-free 7-day replacements aur instant UPI return resolution."
    }
  ];

  const defaultMilestones = [
    { year: "2023", title: "The Inception", desc: "Single room workspace aur 50 curated items ke sath humne safar shuru kiya." },
    { year: "2024", title: "Expanding Direct-to-Consumer", desc: "10,000+ satisfied customers tak express delivery network establish kiya." },
    { year: "2025", title: "High-Tech Fulfilment", desc: "Automated warehouse & quality inspection hub setup kiya taaki same-day dispatch ho sake." },
    { year: "2026", title: "National Footprint", desc: "Pan-India express reach aur 24/7 dedicated customer resolution desk." }
  ];

  const stats = config?.stats?.length > 0 ? config.stats : defaultStats;
  const pillars = config?.pillars?.length > 0 ? config.pillars : defaultPillars;
  const milestones = config?.milestones?.length > 0 ? config.milestones : defaultMilestones;
  const infraItems = config?.infrastructure || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 overflow-hidden">
      
      {/* 1. Colourful Dynamic Hero Showcase Banner */}
      {config?.hero?.isEnabled !== false && (
        <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-8 sm:p-14 text-white shadow-2xl animate-in fade-in duration-500">
          <div className="relative z-10 max-w-3xl space-y-5">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{config?.hero?.badge || "Redefining Online Shopping Experience"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              {config?.hero?.headingPrefix || "Humara Maqsad:"} <br />
              <span className="text-amber-200 underline decoration-pink-300/60 decoration-wavy">
                {config?.hero?.headingHighlight || "Quality & Bharosa Har Order Par"}
              </span>
            </h1>

            <p className="text-pink-100 text-xs sm:text-base leading-relaxed max-w-2xl font-medium">
              {config?.hero?.description ||
                `${storeTitle} par hum tech gadgets, authentic lifestyle wear aur home upgrades ko affordably seedhe factory/warehouse se aap tak deliver karte hain.`}
            </p>

            <div className="pt-3 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="inline-flex items-center space-x-2 bg-white text-gray-900 hover:bg-slate-100 font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xl hover:shadow-2xl active:scale-95 transition"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-4 h-4 text-pink-600" />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center space-x-2 bg-white/15 hover:bg-white/25 text-white font-bold px-6 py-3.5 rounded-2xl text-xs sm:text-sm border border-white/25 backdrop-blur-md transition"
              >
                <span>Contact Support Desk</span>
              </Link>
            </div>
          </div>

          {/* Glowing Ambient Background Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 right-20 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        </section>
      )}

      {/* 2. Live Numbers & Performance Stats (Smooth Count-up) */}
      <section ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((st, i) => (
          <AnimatedStatCard key={st._id || i} stat={st} isVisible={statsInView} />
        ))}
      </section>

      {/* 3. Physical Facilities & Modern Warehouse Infrastructure */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
              Real Infrastructure
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2 tracking-tight">
              Behind The Scenes: Hubs & Labs
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 max-w-sm">
            Humara automated warehouse aur stores barcode sorting aur strict physical quality control par chalte hain.
          </p>
        </div>

        {infraItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {infraItems.map((item) => {
              // Active photos filter (Only isActive === true will show)
              const activeImages = (item.images || []).filter((img) => img.isActive !== false);
              const displayImg = activeImages.length > 0 ? activeImages[0].url : "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80";

              return (
                <div
                  key={item._id}
                  className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-80 flex flex-col justify-end"
                >
                  <img
                    src={displayImg}
                    alt={item.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end text-white z-10">
                    <span className="text-[10px] font-black uppercase text-amber-300 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full w-fit mb-2">
                      {item.tag}
                    </span>
                    <h3 className="text-lg font-bold">{item.title}</h3>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2 leading-relaxed">{item.desc}</p>
                    
                    {activeImages.length > 1 && (
                      <span className="mt-3 text-[10px] text-pink-300 font-bold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>+{activeImages.length - 1} more verified views</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-80">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                alt="Experience Store"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1">
                  <Store className="w-4 h-4" />
                  <span>Flagship Store</span>
                </div>
                <h3 className="text-lg font-bold">Physical Retail & Demo Lounge</h3>
                <p className="text-xs text-gray-300 mt-1">Walk in, try products hands-on aur direct store pickup support.</p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-80">
              <img
                src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
                alt="Automated Warehouse"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
                <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold mb-1">
                  <Boxes className="w-4 h-4" />
                  <span>Central Logistics Hub</span>
                </div>
                <h3 className="text-lg font-bold">Smart Inventory & Dispatch</h3>
                <p className="text-xs text-gray-300 mt-1">Daily 2,000+ orders ka barcode-controlled automated packaging.</p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-80">
              <img
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80"
                alt="Quality Lab"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
                <div className="flex items-center space-x-2 text-pink-400 text-xs font-bold mb-1">
                  <Building2 className="w-4 h-4" />
                  <span>Quality Lab</span>
                </div>
                <h3 className="text-lg font-bold">Inspection & Support HQ</h3>
                <p className="text-xs text-gray-300 mt-1">Direct testing labs aur dedicated escalation floor.</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. Leadership & Founder Spotlight */}
      {config?.founder?.isEnabled !== false && (
        <section className="bg-gradient-to-br from-white via-pink-50/40 to-violet-50/30 p-6 sm:p-12 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Founder Image with Live Ping Badge */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative group">
                <div className="w-64 h-72 sm:w-72 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                  <img
                    src={
                      config?.founder?.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80"
                    }
                    alt="Founder & CEO"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-100 shadow-lg flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400">Leadership</p>
                    <p className="text-xs font-extrabold text-gray-900">{config?.founder?.name || "Rahul Sharma"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Founder Vision & Direct Touchpoints */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
                Leadership Word
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
                "{config?.founder?.quote || "Customer ka bharosa kisi bhi marketing campaign se badhkar hai."}"
              </h2>
              <blockquote className="text-gray-600 text-xs sm:text-sm leading-relaxed border-l-4 border-pink-500 pl-4 italic">
                "{config?.founder?.visionStory ||
                  `Jab humne ${storeTitle} shuru kiya tha, humara ek hi principle tha: jo item user ko mile, wo 100% genuine ho aur reasonable price me mile. Hum kisi bhi middle-agent commission ko hata kar seedha benefit apne Indian consumers ko pass on karte hain.`}"
              </blockquote>

              <div className="pt-2 flex items-center space-x-6">
                <div>
                  <p className="font-extrabold text-gray-900 text-sm">{config?.founder?.name || "Rahul Sharma"}</p>
                  <p className="text-xs text-gray-500">{config?.founder?.designation || "Founder & CEO"}</p>
                </div>

                <div className="flex items-center space-x-2">
                  {/* LinkedIn SVG */}
                  <a
                    href={config?.founder?.socials?.linkedin || "#"}
                    aria-label="LinkedIn"
                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 transition"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                    </svg>
                  </a>

                  {/* Twitter / X SVG */}
                  <a
                    href={config?.founder?.socials?.twitter || "#"}
                    aria-label="Twitter"
                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-sky-500 hover:border-sky-500 transition"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>

                  {/* Direct Email */}
                  <a
                    href={`mailto:${config?.founder?.socials?.email || "founder@store.com"}`}
                    aria-label="Email"
                    className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-pink-600 hover:border-pink-600 transition"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* 5. Core Operational Pillars (Colourful Gradients & Micro-interactions) */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-bold text-pink-600 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">
            Our Guarantees
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-2">
            Kyun {storeTitle} par log bharosa karte hain?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((item, idx) => {
            const IconComponent = PILLAR_ICON_MAP[item.icon] || ShieldCheck;
            return (
              <div
                key={item._id || idx}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${
                      item.color || "from-blue-500 to-cyan-500"
                    } flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex items-center text-xs font-bold text-gray-700">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                  <span>Verified Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Evolution Timeline */}
      <section className="bg-slate-900 text-white p-8 sm:p-12 rounded-3xl space-y-8 shadow-xl">
        <div className="text-center max-w-md mx-auto">
          <span className="text-xs font-bold text-pink-400 uppercase tracking-widest">Our Evolution</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">Humara Ab Tak Ka Safar</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {milestones.map((m, index) => (
            <div
              key={m._id || index}
              className="relative bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl backdrop-blur-md hover:border-pink-500/50 transition-colors"
            >
              <span className="text-2xl font-black bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent font-mono">
                {m.year}
              </span>
              <h4 className="font-bold text-base mt-2 text-white">{m.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Call To Action Footer Card */}
      {config?.cta?.isEnabled !== false && (
        <section className="bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 p-8 sm:p-12 rounded-3xl text-white text-center shadow-xl space-y-4">
          <h2 className="text-2xl sm:text-4xl font-black">
            {config?.cta?.heading || "Experience the Quality Yourself"}
          </h2>
          <p className="text-xs sm:text-sm text-pink-100 max-w-xl mx-auto leading-relaxed">
            {config?.cta?.description ||
              "Latest gadgets, curated fashion aur reliable lifestyle items direct warehouse price par order karein."}
          </p>
          <div className="pt-2">
            <Link
              to={config?.cta?.buttonLink || "/products"}
              className="inline-flex items-center space-x-2 bg-white text-gray-900 hover:bg-slate-100 font-extrabold px-6 py-3.5 rounded-2xl text-xs sm:text-sm shadow-md active:scale-95 transition"
            >
              <span>{config?.cta?.buttonText || "Start Shopping Now"}</span>
              <ArrowRight className="w-4 h-4 text-pink-600" />
            </Link>
          </div>
        </section>
      )}

    </div>
  );
}