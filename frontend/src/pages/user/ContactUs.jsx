import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageCircle,
  Clock,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Building2,
  AlertCircle
} from "lucide-react";
import API from "../../api/axios";

const ICON_MAP = {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Building2,
  Headphones
};

const DEFAULT_CARDS = [
  {
    icon: "Phone",
    title: "Direct Calling Desk",
    desc: "Instant live agent support",
    contact: "+91 81879 21060",
    contactSub: "Active Mon - Sat (9:00 AM - 8:00 PM)",
    action: "tel:+918187921060",
    btnText: "Call Now",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: "MessageCircle",
    title: "WhatsApp Priority Chat",
    desc: "Live order updates & quick query",
    contact: "+91 81879 21060",
    contactSub: "Instant reply within 2 minutes",
    action: "https://wa.me/918187921060",
    btnText: "Start Chat",
    gradient: "from-emerald-500 to-teal-500"
  },
  {
    icon: "Mail",
    title: "Official Email Support",
    desc: "Formal ticketing & billing query",
    contact: "support@khastore.com",
    contactSub: "Turnaround time: 2 - 4 Hours",
    action: "mailto:support@khastore.com",
    btnText: "Send Mail",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    icon: "MapPin",
    title: "Corporate Headquarters",
    desc: "Flagship retail & demo experience",
    contact: "Hazratganj, Lucknow, UP",
    contactSub: "PIN: 226001, Uttar Pradesh",
    action: "https://maps.google.com",
    btnText: "Get Direction",
    gradient: "from-violet-500 to-indigo-500"
  }
];

const DEFAULT_FAQS = [
  {
    question: "Order dispatch hone me kitna time lagta hai?",
    answer: "Hum sabhi orders ko 24 ghante ke andar Lucknow central warehouse se dispatch karte hain. Metro cities me delivery 2-3 din me ho jati hai."
  },
  {
    question: "Product pasand na aane par return kaise initiate karein?",
    answer: "Aap delivery ke 7 dino ke andar order details section ya support WhatsApp par message karke hassle-free pickup schedule kar sakte hain."
  },
  {
    question: "Cash on delivery (COD) available hai?",
    answer: "Ji haan, sabhi eligible PIN codes par COD available hai bina kisi extra platform fees ke."
  }
];

export default function ContactUs() {
  const [config, setConfig] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Order Status & Tracking",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  // Carousel & Scroll States
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [formMapInView, setFormMapInView] = useState(false);
  const [faqInView, setFaqInView] = useState(false);

  const formMapRef = useRef(null);
  const faqRef = useRef(null);

  // 1. Fetch Dynamic CMS Configuration
  useEffect(() => {
    API.get("/contact/config")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const data = res.data.data;
          setConfig({
            banner: data.banner || {
              isEnabled: true,
              tagline: "24/7 Dedicated Support Channels",
              heading: "Humse Baat Karein, Hum Hamesha Aapke Sath Hain.",
              description: "Product inquiry, order tracking, returns ya feedback ke liye hume reach karein."
            },
            carouselCards: data.carouselCards?.length > 0 ? data.carouselCards : DEFAULT_CARDS,
            mapConfig: data.mapConfig || {
              isEnabled: true,
              locationTitle: "Experience Center Location",
              embedUrl: "https://maps.google.com/maps?q=Lucknow&t=&z=13&ie=UTF8&iwloc=&output=embed",
              visitingHours: "Visiting Hours: 10:00 AM - 7:00 PM (Monday to Saturday)"
            },
            formConfig: data.formConfig || {
              badgeText: "Quick Ticket",
              heading: "Send Us a Direct Message",
              statusBadge: "Agents Online",
              inquiryOptions: [
                "Order Status & Tracking",
                "Return & Refund Request",
                "Product Information",
                "Business Partnership"
              ]
            },
            faqs: data.faqs?.length > 0 ? data.faqs : DEFAULT_FAQS
          });

          if (data.formConfig?.inquiryOptions?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              subject: data.formConfig.inquiryOptions[0]
            }));
          }
        }
      })
      .catch((err) => {
        console.warn("Backend CMS fetch failed, falling back to default layout:", err.message);
        setConfig({
          banner: {
            isEnabled: true,
            tagline: "24/7 Dedicated Support Channels",
            heading: "Humse Baat Karein, Hum Hamesha Aapke Sath Hain.",
            description: "Product inquiry, order tracking, returns ya feedback ke liye hume reach karein."
          },
          carouselCards: DEFAULT_CARDS,
          mapConfig: {
            isEnabled: true,
            locationTitle: "Experience Center Location",
            embedUrl: "https://maps.google.com/maps?q=Lucknow&t=&z=13&ie=UTF8&iwloc=&output=embed",
            visitingHours: "Visiting Hours: 10:00 AM - 7:00 PM (Monday to Saturday)"
          },
          formConfig: {
            badgeText: "Quick Ticket",
            heading: "Send Us a Direct Message",
            statusBadge: "Agents Online",
            inquiryOptions: [
              "Order Status & Tracking",
              "Return & Refund Request",
              "Product Information",
              "Business Partnership"
            ]
          },
          faqs: DEFAULT_FAQS
        });
      });
  }, []);

  // Screen resize handler
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerView(1.15);
      else if (window.innerWidth < 1024) setItemsPerView(2.2);
      else setItemsPerView(3);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cards = config?.carouselCards || DEFAULT_CARDS;
  const maxIndex = Math.max(0, cards.length - Math.floor(itemsPerView));

  // Autoplay Touchpoint Cards
  useEffect(() => {
    if (isPaused || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, maxIndex]);

  // Entrance Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === formMapRef.current) setFormMapInView(true);
            if (entry.target === faqRef.current) setFaqInView(true);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (formMapRef.current) observer.observe(formMapRef.current);
    if (faqRef.current) observer.observe(faqRef.current);
    return () => observer.disconnect();
  }, []);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await API.post("/contact/query", formData);
      if (res.data?.success) {
        const queryData = res.data.data;
        const refId = queryData?._id ? queryData._id.slice(-6).toUpperCase() : "CONFIRMED";

        setTicketDetails({
          ticketId: refId,
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          subject: formData.subject
        });

        // Reset inputs
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: config?.formConfig?.inquiryOptions?.[0] || "Order Status & Tracking",
          message: ""
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Ticket submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 overflow-hidden">
      {/* 1. Header Banner */}
      {config?.banner?.isEnabled !== false && (
        <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{config?.banner?.tagline || "24/7 Dedicated Support Channels"}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {config?.banner?.heading || "Humse Baat Karein, Hum Hamesha Aapke Sath Hain."}
            </h1>
            <p className="text-pink-100 text-xs sm:text-sm">
              {config?.banner?.description || "Product inquiry, order tracking, returns ya feedback ke liye hume reach karein."}
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </section>
      )}

      {/* 2. Contact Cards Carousel */}
      {cards.length > 0 && (
        <section
          className="bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm bg-gradient-to-r from-violet-600 to-pink-600">
                <Sparkles className="w-3 h-3" />
                <span>Direct Channels</span>
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1.5 tracking-tight">
                Contact & Support Details
              </h2>
            </div>
            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button
                onClick={() => setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:text-pink-600 flex items-center justify-center shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))}
                className="w-9 h-9 rounded-xl border border-gray-200 bg-white hover:text-pink-600 flex items-center justify-center shadow-sm cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-hidden py-1">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${carouselIndex * (100 / itemsPerView)}%)` }}
            >
              {cards.map((card, idx) => {
                const IconComponent = ICON_MAP[card.icon] || Phone;
                return (
                  <div
                    key={card._id || idx}
                    className="shrink-0 px-2 box-border"
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    <div className="h-full bg-gray-50/70 hover:bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                      <div>
                        <div
                          className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${card.gradient || "from-blue-500 to-cyan-500"} flex items-center justify-center text-white mb-3.5 shadow-md`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{card.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                        <p className="text-sm font-black text-gray-900 mt-3">{card.contact}</p>
                        <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{card.contactSub}</p>
                      </div>
                      <a
                        href={card.action}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 w-full py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-900 hover:text-white text-center transition"
                      >
                        {card.btnText || "Connect"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. Form & Map Section */}
      <section ref={formMapRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
        <div
          className={`lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 transition-all duration-1000 ease-out transform ${
            formMapInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-20 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold text-pink-600 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">
                {config?.formConfig?.badgeText || "Quick Ticket"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                {config?.formConfig?.heading || "Send Us a Direct Message"}
              </h2>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{config?.formConfig?.statusBadge || "Agents Online"}</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submission Confirmation Card */}
          {ticketDetails ? (
            <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border border-emerald-200 rounded-3xl p-6 sm:p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="px-3 py-1 bg-white text-emerald-800 font-mono text-xs font-black rounded-full border border-emerald-200 inline-block shadow-sm">
                  TICKET #{ticketDetails.ticketId}
                </span>
                <h4 className="font-black text-slate-900 text-lg sm:text-xl">Inquiry Submitted Successfully!</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Namaste <b>{ticketDetails.name}</b>, aapka support ticket register kar liya gaya hai.
                </p>
              </div>

              {/* Status Dispatch Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 flex items-center space-x-3 shadow-sm">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] overflow-hidden">
                    <p className="font-bold text-slate-800">WhatsApp Confirmation</p>
                    <p className="text-slate-500 truncate">{ticketDetails.phone}</p>
                  </div>
                </div>

                <div className="bg-white/80 p-3.5 rounded-2xl border border-emerald-100 flex items-center space-x-3 shadow-sm">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-[11px] overflow-hidden">
                    <p className="font-bold text-slate-800">Email Confirmation</p>
                    <p className="text-slate-500 truncate">{ticketDetails.email}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setTicketDetails(null)}
                className="mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Submit Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone / WhatsApp Number *</label>
                  <input
                    required
                    type="tel"
                    placeholder="10-digit number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    required
                    type="email"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inquiry Type</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs outline-none bg-white cursor-pointer"
                  >
                    {(config?.formConfig?.inquiryOptions || [
                      "Order Status & Tracking",
                      "Return & Refund Request",
                      "Product Information",
                      "Business Partnership"
                    ]).map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Detailed Message *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Order ID ya support query ka pura vivaran likhein..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 rounded-xl px-4 py-2.5 text-xs outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 text-white font-bold rounded-xl text-xs uppercase shadow-lg shadow-pink-500/25 active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Dynamic Map Component */}
        {config?.mapConfig?.isEnabled !== false && (
          <div
            className={`lg:col-span-5 space-y-5 transition-all duration-1000 ease-out transform ${
              formMapInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-20 pointer-events-none"
            }`}
          >
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {config?.mapConfig?.locationTitle || "Store Experience Hub"}
                </h3>
              </div>
              <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
                <iframe
                  title="Store Location"
                  src={
                    config?.mapConfig?.embedUrl ||
                    "https://maps.google.com/maps?q=Lucknow&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                />
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 pt-1">
                <Clock className="w-4 h-4 text-violet-600 shrink-0" />
                <span>{config?.mapConfig?.visitingHours || "Mon - Sat: 10:00 AM - 7:00 PM"}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. FAQs Accordion */}
      {(config?.faqs || DEFAULT_FAQS).length > 0 && (
        <section
          ref={faqRef}
          className={`max-w-3xl mx-auto transition-all duration-700 ease-out transform ${
            faqInView ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
          }`}
        >
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-4">
            <div className="text-center space-y-1 pb-2">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
                Quick Help
              </span>
              <div className="flex items-center justify-center space-x-2 pt-1">
                <HelpCircle className="w-5 h-5 text-violet-600" />
                <h3 className="text-xl font-black text-gray-900">Frequently Asked Questions</h3>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {(config?.faqs || DEFAULT_FAQS).map((faq, idx) => (
                <div key={faq._id || idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-gray-800 flex justify-between items-center bg-gray-50/70 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        activeFaq === idx ? "rotate-180 text-pink-600" : ""
                      }`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="p-4 text-xs sm:text-sm text-gray-600 bg-white leading-relaxed border-t border-gray-100">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}