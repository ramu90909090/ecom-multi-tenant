import React, { useState, useEffect } from "react";
import {
  Save,
  Plus,
  Trash2,
  Edit,
  MapPin,
  HelpCircle,
  Phone,
  LayoutTemplate,
  MessageCircle,
  Mail,
  Building2,
  Headphones,
  ExternalLink,
  RefreshCw,
  X,
  Sparkles
} from "lucide-react";
import API from "../../api/axios";

const ICON_COMPONENTS = {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Building2,
  Headphones
};

export default function ContactPageCms() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [activeTab, setActiveTab] = useState("banner");

  // Card Modal State
  const [cardModal, setCardModal] = useState({ open: false, isEdit: false, data: {} });
  // FAQ Modal State
  const [faqModal, setFaqModal] = useState({ open: false, isEdit: false, data: {} });

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await API.get("/contact/config");
      if (res.data?.success && res.data.data) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error("Config fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Save General Banner, Map & Form Settings
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      const res = await API.put("/contact/config/general", {
        banner: config.banner,
        mapConfig: config.mapConfig,
        formConfig: config.formConfig
      });
      if (res.data?.success) {
        alert("✅ Settings successfully save ho gayi!");
        fetchConfig();
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setSavingGeneral(false);
    }
  };

  // Card Save / Edit
  const handleSaveCard = async (e) => {
    e.preventDefault();
    try {
      if (cardModal.isEdit) {
        await API.put(`/contact/config/cards/${cardModal.data._id}`, cardModal.data);
      } else {
        await API.post("/contact/config/cards", cardModal.data);
      }
      setCardModal({ open: false, isEdit: false, data: {} });
      fetchConfig();
    } catch (err) {
      alert("Error saving card: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteCard = async (id) => {
    if (window.confirm("Kya aap sach me is Card ko delete karna chahte hain?")) {
      try {
        await API.delete(`/contact/config/cards/${id}`);
        fetchConfig();
      } catch (err) {
        alert("Card delete error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  // FAQ Save / Edit
  const handleSaveFaq = async (e) => {
    e.preventDefault();
    try {
      if (faqModal.isEdit) {
        await API.put(`/contact/config/faqs/${faqModal.data._id}`, faqModal.data);
      } else {
        await API.post("/contact/config/faqs", faqModal.data);
      }
      setFaqModal({ open: false, isEdit: false, data: {} });
      fetchConfig();
    } catch (err) {
      alert("Error saving FAQ: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteFaq = async (id) => {
    if (window.confirm("Kya aap sach me is FAQ ko delete karna chahte hain?")) {
      try {
        await API.delete(`/contact/config/faqs/${id}`);
        fetchConfig();
      } catch (err) {
        alert("FAQ delete error: " + (err.response?.data?.message || err.message));
      }
    }
  };

  if (loading || !config) {
    return (
      <div className="p-12 text-center text-xs font-bold text-slate-400">
        Loading Contact Page CMS Studio...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Contact Page Visual Studio
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Real-time multi-tenant visual editor for Banners, Cards, Maps, Forms & FAQ accordions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/contact"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Public Page</span>
          </a>
          <button
            onClick={fetchConfig}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Studio"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-slate-200">
        {[
          { id: "banner", label: "Banner & Hero", icon: LayoutTemplate },
          { id: "cards", label: `Contact Cards (${config.carouselCards?.length || 0})`, icon: Phone },
          { id: "map", label: "Google Map & Form", icon: MapPin },
          { id: "faqs", label: `FAQs (${config.faqs?.length || 0})`, icon: HelpCircle }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
                activeTab === tab.id
                  ? "border-pink-600 text-pink-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Banner & Hero */}
      {activeTab === "banner" && (
        <form onSubmit={handleSaveGeneral} className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-600" />
              <span>Hero Banner Settings</span>
            </h3>
            <label className="text-xs font-bold text-slate-600 flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.banner?.isEnabled !== false}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    banner: { ...config.banner, isEnabled: e.target.checked }
                  })
                }
                className="accent-pink-600 rounded"
              />
              <span>Banner Active</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
            <div>
              <label className="block mb-1">Tagline Badge</label>
              <input
                type="text"
                value={config.banner?.tagline || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    banner: { ...config.banner, tagline: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block mb-1">Headline Heading</label>
              <input
                type="text"
                value={config.banner?.heading || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    banner: { ...config.banner, heading: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-pink-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1">Description</label>
              <textarea
                rows={3}
                value={config.banner?.description || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    banner: { ...config.banner, description: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:bg-white focus:border-pink-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingGeneral}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingGeneral ? "Saving..." : "Save Banner"}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: Contact Priority Cards */}
      {activeTab === "cards" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Direct Contact Department Cards</h3>
            <button
              onClick={() =>
                setCardModal({
                  open: true,
                  isEdit: false,
                  data: {
                    icon: "Phone",
                    title: "",
                    desc: "",
                    contact: "",
                    contactSub: "",
                    action: "",
                    btnText: "Call Now",
                    gradient: "from-blue-500 to-cyan-500"
                  }
                })
              }
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(config.carouselCards || []).map((card) => {
              const IconComp = ICON_COMPONENTS[card.icon] || Phone;
              return (
                <div key={card._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.gradient || "from-blue-500 to-cyan-500"} flex items-center justify-center text-white shadow-sm`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                      {card.icon}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{card.title}</h4>
                    <p className="text-[11px] text-slate-400">{card.desc}</p>
                    <p className="text-xs font-black text-indigo-600 mt-2 font-mono">{card.contact}</p>
                  </div>

                  <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setCardModal({ open: true, isEdit: true, data: { ...card } })}
                      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 cursor-pointer"
                      title="Edit Card"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card._id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-600 cursor-pointer"
                      title="Delete Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Map & Form Settings */}
      {activeTab === "map" && (
        <form onSubmit={handleSaveGeneral} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm text-xs font-bold text-slate-700">
            <h3 className="font-black text-sm text-slate-900 border-b pb-2">1. Google Map Embed Frame</h3>
            <div>
              <label className="block mb-1">Location Title</label>
              <input
                type="text"
                value={config.mapConfig?.locationTitle || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mapConfig: { ...config.mapConfig, locationTitle: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Google Maps Iframe Embed URL (src)</label>
              <textarea
                rows={3}
                value={config.mapConfig?.embedUrl || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mapConfig: { ...config.mapConfig, embedUrl: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-mono text-[11px] focus:bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Visiting Hours</label>
              <input
                type="text"
                value={config.mapConfig?.visitingHours || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mapConfig: { ...config.mapConfig, visitingHours: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm text-xs font-bold text-slate-700">
            <h3 className="font-black text-sm text-slate-900 border-b pb-2">2. Support Form Config</h3>
            <div>
              <label className="block mb-1">Form Heading</label>
              <input
                type="text"
                value={config.formConfig?.heading || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    formConfig: { ...config.formConfig, heading: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Badge Text</label>
              <input
                type="text"
                value={config.formConfig?.badgeText || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    formConfig: { ...config.formConfig, badgeText: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
              />
            </div>
            <div>
              <label className="block mb-1">Agents Status Pill</label>
              <input
                type="text"
                value={config.formConfig?.statusBadge || ""}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    formConfig: { ...config.formConfig, statusBadge: e.target.value }
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none focus:bg-white"
              />
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingGeneral}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition"
              >
                {savingGeneral ? "Saving..." : "Save Map & Form"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 4: Frequently Asked Questions */}
      {activeTab === "faqs" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800">Dynamic FAQ Accordions</h3>
            <button
              onClick={() =>
                setFaqModal({
                  open: true,
                  isEdit: false,
                  data: { question: "", answer: "" }
                })
              }
              className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add FAQ</span>
            </button>
          </div>

          <div className="space-y-3">
            {(config.faqs || []).map((faq) => (
              <div key={faq._id} className="bg-white p-4.5 border border-slate-100 rounded-2xl flex justify-between items-start shadow-sm">
                <div className="space-y-1 pr-4 text-xs">
                  <h4 className="font-black text-slate-900">{faq.question}</h4>
                  <p className="text-slate-600 leading-relaxed font-normal">{faq.answer}</p>
                </div>
                <div className="flex space-x-1.5 shrink-0">
                  <button
                    onClick={() => setFaqModal({ open: true, isEdit: true, data: { ...faq } })}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 cursor-pointer"
                    title="Edit FAQ"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteFaq(faq._id)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500 hover:text-rose-600 cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CARD MODAL */}
      {cardModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveCard} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-black text-sm text-slate-900">
                {cardModal.isEdit ? "Edit Contact Card" : "New Contact Card"}
              </h3>
              <button type="button" onClick={() => setCardModal({ open: false, isEdit: false, data: {} })}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="text-xs space-y-3 font-bold text-slate-700">
              <div>
                <label className="block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WhatsApp Priority Chat"
                  value={cardModal.data.title || ""}
                  onChange={(e) => setCardModal({ ...cardModal, data: { ...cardModal.data, title: e.target.value } })}
                  className="w-full border rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live order updates & quick query"
                  value={cardModal.data.desc || ""}
                  onChange={(e) => setCardModal({ ...cardModal, data: { ...cardModal.data, desc: e.target.value } })}
                  className="w-full border rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Contact String (Phone/Email) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43210"
                  value={cardModal.data.contact || ""}
                  onChange={(e) => setCardModal({ ...cardModal, data: { ...cardModal.data, contact: e.target.value } })}
                  className="w-full border rounded-xl p-2.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1">Icon</label>
                  <select
                    value={cardModal.data.icon || "Phone"}
                    onChange={(e) => setCardModal({ ...cardModal, data: { ...cardModal.data, icon: e.target.value } })}
                    className="w-full border rounded-xl p-2.5 outline-none bg-white cursor-pointer"
                  >
                    <option value="Phone">Phone</option>
                    <option value="MessageCircle">WhatsApp</option>
                    <option value="Mail">Email</option>
                    <option value="MapPin">Location</option>
                    <option value="Building2">Office</option>
                    <option value="Headphones">Support</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1">Button Label</label>
                  <input
                    type="text"
                    value={cardModal.data.btnText || "Contact"}
                    onChange={(e) => setCardModal({ ...cardModal, data: { ...cardModal.data, btnText: e.target.value } })}
                    className="w-full border rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1">Action Link (tel / wa.me / mailto) *</label>
                <input
                  type="text"
                  required
                  placeholder="https://wa.me/919876543210"
                  value={cardModal.data.action || ""}
                  onChange={(e) => setCardModal({ ...cardModal, data: { ...cardModal.data, action: e.target.value } })}
                  className="w-full border rounded-xl p-2.5 outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCardModal({ open: false, isEdit: false, data: {} })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Card
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ MODAL */}
      {faqModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <form onSubmit={handleSaveFaq} className="bg-white rounded-3xl max-w-md w-full p-6 space-y-3 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-black text-sm text-slate-900">
                {faqModal.isEdit ? "Edit FAQ" : "New FAQ Item"}
              </h3>
              <button type="button" onClick={() => setFaqModal({ open: false, isEdit: false, data: {} })}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="text-xs space-y-3 font-bold text-slate-700">
              <div>
                <label className="block mb-1">Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Return kaise place karein?"
                  value={faqModal.data.question || ""}
                  onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, question: e.target.value } })}
                  className="w-full border rounded-xl p-2.5 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Detailed Answer *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detailed answer text..."
                  value={faqModal.data.answer || ""}
                  onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, answer: e.target.value } })}
                  className="w-full border rounded-xl p-2.5 outline-none resize-none font-normal"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFaqModal({ open: false, isEdit: false, data: {} })}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save FAQ
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}