import React, { useState, useEffect, useRef } from "react";
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
  Clock
} from "lucide-react";
import API from "../../api/axios";
import { useSettings } from "../../context/SettingsContext";

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

function AnimatedStatCard({ stat, isVisible }) {
  const count = useCounter(stat.number, isVisible, 2000);

  return (
    <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 text-center hover:-translate-y-1.5 transition-all duration-300">
      <h3 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
        {stat.prefix || ""}
        {stat.isDecimal ? (count / 10).toFixed(1) : count.toLocaleString()}
        {stat.suffix || "+"}
      </h3>
      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-2">{stat.label}</p>
      <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{stat.change}</p>
    </div>
  );
}

export default function AboutUs() {
  const { tenant } = useSettings();
  const [config, setConfig] = useState(null);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    API.get("/about/config")
      .then((res) => {
        if (res.data?.data) {
          setConfig(res.data.data);
        }
      })
      .catch((err) => console.warn("About CMS load warning:", err));
  }, []);

  // IntersectionObserver for Stats Number Counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsInView(true);
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) observer.observe(statsRef.current);

    const safetyTimer = setTimeout(() => setStatsInView(true), 600);
    return () => {
      observer.disconnect();
      clearTimeout(safetyTimer);
    };
  }, []);

  const storeTitle = tenant?.storeName || "KHASTORE";

  const defaultStats = [
    { number: 75000, suffix: "+", label: "Delivered Orders", change: "Pan-India Reach" },
    { number: 120, suffix: "+", label: "Genuine Brands", change: "Verified Partners" },
    { number: 48, isDecimal: true, suffix: " ★", label: "Customer Rating", change: "Based on 15k+ Reviews" },
    { number: 24, prefix: "< ", suffix: " Hrs", label: "Dispatch Speed", change: "Fastest Fulfilment" }
  ];

  const stats = config?.stats?.length > 0 ? config.stats : defaultStats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 overflow-hidden">
      {/* 1. Colourful Animated Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-8 sm:p-14 text-white shadow-2xl animate-in fade-in duration-500">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{config?.hero?.badge || "Redefining Online Shopping"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {config?.hero?.headingPrefix || "Humara Maqsad:"}{" "}
            <span className="text-amber-200">{config?.hero?.headingHighlight || "Quality & Bharosa Har Order Par"}</span>
          </h1>
          <p className="text-pink-100 text-xs sm:text-sm leading-relaxed">
            {config?.hero?.description ||
              `${storeTitle} par hum tech gadgets, authentic lifestyle wear aur home upgrades ko affordably seedhe aap tak deliver karte hain bina kisi middleman markup ke.`}
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. Live Number Counter Stats (0 se Target tak Animated) */}
      <section ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((st, i) => (
          <AnimatedStatCard key={i} stat={st} isVisible={statsInView} />
        ))}
      </section>

      {/* 3. Physical Retail & Warehouse Infrastructure Showcase */}
      <section className="space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
            Real Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Behind The Scenes
          </h2>
          <p className="text-xs text-gray-500">Humare verified stores aur automated distribution hubs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Retail Store */}
          <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-72 sm:h-80">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
              alt="Experience Store"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold mb-1">
                <Store className="w-4 h-4" />
                <span>Flagship Experience Store</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">Physical Retail & Demo Lounge</h3>
              <p className="text-xs text-gray-300 mt-1">Walk in, try products hands-on aur direct store pickup support.</p>
            </div>
          </div>

          {/* Card 2: Logistics Hub */}
          <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-72 sm:h-80">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80"
              alt="Warehouse"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
              <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold mb-1">
                <Boxes className="w-4 h-4" />
                <span>Central Logistics Hub</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">Smart Inventory & Dispatch</h3>
              <p className="text-xs text-gray-300 mt-1">Daily 2,000+ orders ka barcode-controlled automated packaging.</p>
            </div>
          </div>

          {/* Card 3: HQ & Labs */}
          <div className="group relative rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-900 h-72 sm:h-80">
            <img
              src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&q=80"
              alt="Quality Lab"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end text-white">
              <div className="flex items-center space-x-2 text-pink-400 text-xs font-bold mb-1">
                <Building2 className="w-4 h-4" />
                <span>Headquarters & Labs</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">Tech & Customer Support HQ</h3>
              <p className="text-xs text-gray-300 mt-1">Customer grievances, engineering and design operations floor.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Meet The Founder / Owner Profile with Glow Badges */}
      <section className="bg-gradient-to-br from-white via-pink-50/30 to-violet-50/20 p-6 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Owner Image with Floating Ping Badge */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative group">
              <div className="w-64 h-72 sm:w-72 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80"
                  alt="Founder & CEO"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-gray-100 shadow-lg flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Founder & CEO</p>
                  <p className="text-xs font-extrabold text-gray-900">{config?.founder?.name || "Rahul Sharma"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Message & Vision */}
          <div className="lg:col-span-7 space-y-4">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
              Leadership Word
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
              "{config?.founder?.quote || "Customer ka bharosa kisi bhi marketing campaign se badhkar hai."}"
            </h2>
            <blockquote className="text-gray-600 text-sm leading-relaxed border-l-4 border-pink-500 pl-4 italic">
              "{config?.founder?.visionStory ||
                `Jab humne ${storeTitle} shuru kiya tha, humara ek hi principle tha: jo item user ko mile, wo 100% genuine ho aur reasonable price me mile. Hum kisi bhi middle-agent commission ko hata kar seedha benefit apne consumers ko pass on karte hain.`}"
            </blockquote>

            <div className="pt-2 flex items-center space-x-6">
              <div>
                <p className="font-extrabold text-gray-900 text-sm">{config?.founder?.name || "Rahul Sharma"}</p>
                <p className="text-xs text-gray-500">{config?.founder?.designation || "Founder & CEO"}</p>
              </div>

              {/* Verified Inline SVG Social Icons */}
              <div className="flex items-center space-x-2">
                <a
                  href="#owner-linkedin"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                <a
                  href="#owner-twitter"
                  aria-label="Twitter"
                  className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-sky-500 hover:border-sky-500 transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
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
          {[
            {
              icon: ShieldCheck,
              title: "100% Genuine Brands",
              color: "from-blue-500 to-cyan-500",
              desc: "Direct OEM tie-ups bina kisi middleman ya fake products ke risk ke."
            },
            {
              icon: Truck,
              title: "Lightning Fast Dispatch",
              color: "from-pink-500 to-rose-500",
              desc: "Advanced packaging aur 24 ghante ke andar direct courier partner handover."
            },
            {
              icon: Award,
              title: "Multi-Tier Quality Check",
              color: "from-amber-500 to-orange-500",
              desc: "Har product dispatch hone se pehle 4 physical quality checks se guzarta hai."
            },
            {
              icon: HeartHandshake,
              title: "Customer-First Support",
              color: "from-violet-500 to-indigo-500",
              desc: "Hassle-free 7-day replacements aur instant UPI return resolution."
            }
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group"
            >
              <div>
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pillar.color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform`}
                >
                  <pillar.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">{pillar.title}</h3>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">{pillar.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}