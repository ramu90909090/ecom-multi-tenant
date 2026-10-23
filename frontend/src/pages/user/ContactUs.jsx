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
    contact: "support@store.com",
    contactSub: "Turnaround time: 2 - 4 Hours",
    action: "mailto:support@store.com",
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
    answer: "Hum sabhi orders ko 24 ghante ke andar warehouse se dispatch karte hain. Metro cities me delivery 2-3 din me ho jati hai."
  },
  {
    question: "Product return kaise initiate karein?",
    answer: "Aap delivery ke 7 dino ke andar order details section ya support WhatsApp par message karke free doorstep pickup schedule kar sakte hain."
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  // Carousel & Scroll States
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  // Scroll Trigger States for Left/Right/Zoom animations
  const [formMapInView, setFormMapInView] = useState(false);
  const [faqInView, setFaqInView] = useState(false);

  const formMapRef = useRef(null);
  const faqRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    API.get("/contact/config")
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setConfig(res.data.data);
        }
      })
      .catch((err) => console.warn("Contact CMS fetch fallback:", err));
  }, []);

  // Screen resize handler for Carousel responsiveness
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

  const cards = config?.carouselCards?.length > 0 ? config.carouselCards : DEFAULT_CARDS;
  const faqs = config?.faqs?.length > 0 ? config.faqs : DEFAULT_FAQS;
  const maxIndex = Math.max(0, cards.length - Math.floor(itemsPerView));

  // Carousel Auto Play
  useEffect(() => {
    if (isPaused || maxIndex === 0) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 3800);
    return () => clearInterval(interval);
  }, [isPaused, maxIndex]);

  // Touch Swipe Handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };
  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    if (diff < -50) setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  // IntersectionObserver for Left (Form) & Right (Map) slide + Center Zoom (FAQ)
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

    // Auto-fallback in 400ms
    const timer = setTimeout(() => {
      setFormMapInView(true);
      setFaqInView(true);
    }, 400);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await API.post("/contact/query", formData);
      if (res.data?.success) {
        setIsSubmitted(true);
        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "Order Status & Tracking",
          message: ""
        });
        setTimeout(() => setIsSubmitted(false), 5000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Failed to submit message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16 overflow-hidden">
      {/* 1. Header Banner with Colourful Floating Gradients */}
      <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-8 sm:p-12 text-white shadow-xl animate-in fade-in duration-500">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{config?.banner?.tagline || "24/7 Dedicated Support Channels"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {config?.banner?.heading || "Humse Baat Karein, Hum Hamesha Aapke Sath Hain."}
          </h1>
          <p className="text-pink-100 text-xs sm:text-sm">
            {config?.banner?.description || "Product inquiry, order tracking, returns ya feedback ke liye niche diye channels se hume reach karein."}
          </p>
        </div>
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* 2. Contact Cards Carousel with Vibrant Gradients */}
      <section
        className="bg-white/95 backdrop-blur-md p-5 sm:p-7 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-5"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <span className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white shadow-sm bg-gradient-to-r from-violet-600 to-pink-600">
              <Sparkles className="w-3 h-3" />
              <span>Direct Touchpoints</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1.5 tracking-tight">
              Contact & Support Details
            </h2>
            <p className="text-xs text-gray-500">Swipe ya arrows ka use karke alag-alag departments dekhein</p>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => setCarouselIndex((prev) => (prev <= 0 ? maxIndex : prev - 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-pink-600 hover:border-pink-600 flex items-center justify-center shadow-sm active:scale-95 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))}
              className="w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-pink-600 hover:border-pink-600 flex items-center justify-center shadow-sm active:scale-95 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Carousel Slider Track */}
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
                        className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${card.gradient || "from-blue-500 to-cyan-500"} flex items-center justify-center text-white mb-3.5 shadow-md group-hover:scale-110 transition-transform`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base">{card.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{card.desc}</p>
                      <p className="text-sm font-black text-gray-900 mt-3">{card.contact}</p>
                      <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{card.contactSub}</p>
                    </div>

                    <a
                      href={card.action || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-900 hover:text-white hover:border-gray-900 text-center transition duration-200 block"
                    >
                      {card.btnText || "Contact"}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Form (Left Slide-in) & Google Map (Right Slide-in) */}
      <section
        ref={formMapRef}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative"
      >
        {/* Support Inquiry Form (Slides from LEFT) */}
        <div
          className={`lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6 transition-all duration-700 ease-out transform ${
            formMapInView
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-14 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold text-pink-600 uppercase tracking-widest bg-pink-50 px-3 py-1 rounded-full">
                Quick Ticket
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                Send Us a Direct Message
              </h2>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Agents Online</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2 animate-in fade-in">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-bold text-emerald-900 text-base">Message Sent Successfully!</h4>
              <p className="text-xs text-emerald-700">Aapki request receive ho gayi hai. Humara agent jald contact karega.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl px-4 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    placeholder="+91 81879 21060"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl px-4 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="rahul@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl px-4 py-2.5 text-xs font-medium outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inquiry Type</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl px-4 py-2.5 text-xs font-medium outline-none transition cursor-pointer"
                  >
                    <option value="Order Status & Tracking">Order Status & Tracking</option>
                    <option value="Return & Refund Request">Return & Refund Request</option>
                    <option value="Product Information">Product Information</option>
                    <option value="Business Partnership">Business Partnership</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Detailed Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Order ID ya query detail yahan explain karein..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-xl px-4 py-2.5 text-xs font-medium outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/25 active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Sending Ticket..." : "Submit Ticket"}</span>
              </button>
            </form>
          )}
        </div>

        {/* Google Map (Slides from RIGHT) */}
        <div
          className={`lg:col-span-5 space-y-5 transition-all duration-700 ease-out transform ${
            formMapInView
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-14 pointer-events-none"
          }`}
        >
          <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-pink-600" />
              <h3 className="font-bold text-gray-900 text-sm">Experience Center Location</h3>
            </div>

            <div className="h-64 sm:h-80 w-full rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
              <iframe
                title="Office Location Map"
                src={
                  config?.mapConfig?.embedUrl ||
                  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113911.23388796856!2d80.85966601662998!3d26.848622994073356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399bfd991f32b16b%3A0x93ccba8909978be7!2sLucknow%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                }
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex items-center space-x-2 text-xs text-gray-500 pt-1">
              <Clock className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Visiting Hours: 10:00 AM - 7:00 PM (Monday to Saturday)</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Frequently Asked Questions (Center ZOOM-IN Scale Effect) */}
      <section
        ref={faqRef}
        className={`max-w-3xl mx-auto transition-all duration-700 ease-out transform ${
          faqInView
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-pink-500/5 space-y-4">
          <div className="text-center space-y-1 pb-2">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
              Quick Solutions
            </span>
            <div className="flex items-center justify-center space-x-2 pt-1">
              <HelpCircle className="w-5 h-5 text-violet-600" />
              <h3 className="text-xl font-black text-gray-900">Frequently Asked Questions</h3>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {faqs.map((faq, idx) => {
              const qText = faq.question || faq.q;
              const aText = faq.answer || faq.a;

              return (
                <div
                  key={faq._id || idx}
                  className="border border-gray-100 rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-gray-800 flex justify-between items-center bg-gray-50/70 hover:bg-gray-100 transition cursor-pointer"
                  >
                    <span>{qText}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                        activeFaq === idx ? "rotate-180 text-pink-600" : ""
                      }`}
                    />
                  </button>
                  {activeFaq === idx && (
                    <div className="p-4 text-xs sm:text-sm text-gray-600 bg-white leading-relaxed border-t border-gray-100 animate-in fade-in">
                      {aText}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}