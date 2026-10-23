import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { Plus, Trash2, Edit, Save, MapPin, Phone, HelpCircle } from "lucide-react";

export default function ContactPageCms() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Card & FAQ Modal States
  const [newCard, setNewCard] = useState({
    icon: "Phone",
    title: "",
    desc: "",
    contact: "",
    contactSub: "",
    action: "",
    btnText: "Contact"
  });
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });

  const fetchContactConfig = async () => {
    try {
      const res = await API.get("/contact/config");
      if (res.data?.data) {
        setConfig(res.data.data);
      }
    } catch (err) {
      console.error("Contact config fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactConfig();
  }, []);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await API.put("/contact/config/general", config);
      alert("✅ Contact Page General Settings Saved!");
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      await API.post("/contact/config/cards", newCard);
      alert("✅ Contact Channel Card Added!");
      setNewCard({ icon: "Phone", title: "", desc: "", contact: "", contactSub: "", action: "", btnText: "Contact" });
      fetchContactConfig();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (window.confirm("Are you sure you want to delete this contact card?")) {
      await API.delete(`/contact/config/cards/${cardId}`);
      fetchContactConfig();
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    try {
      await API.post("/contact/config/faqs", newFaq);
      alert("✅ FAQ Item Added!");
      setNewFaq({ question: "", answer: "" });
      fetchContactConfig();
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  const handleDeleteFaq = async (faqId) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      await API.delete(`/contact/config/faqs/${faqId}`);
      fetchContactConfig();
    }
  };

  if (loading || !config) {
    return <div className="p-8 text-center text-xs font-bold text-slate-400">Loading Contact CMS...</div>;
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Contact Us Page CMS Studio</h1>
        <p className="text-xs text-slate-400 font-bold mt-1">Customize support cards, map location, inquiry forms & FAQs</p>
      </div>

      {/* 1. General Banner & Map Config Form */}
      <form onSubmit={handleSaveGeneral} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs font-bold text-slate-700">
        <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">1. Header Banner & Google Map</h3>
        <div>
          <label className="block mb-1">Banner Tagline</label>
          <input
            value={config.banner?.tagline || ""}
            onChange={(e) => setConfig({ ...config, banner: { ...config.banner, tagline: e.target.value } })}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block mb-1">Banner Heading</label>
          <input
            value={config.banner?.heading || ""}
            onChange={(e) => setConfig({ ...config, banner: { ...config.banner, heading: e.target.value } })}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block mb-1">Banner Description</label>
          <textarea
            rows={2}
            value={config.banner?.description || ""}
            onChange={(e) => setConfig({ ...config, banner: { ...config.banner, description: e.target.value } })}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block mb-1">Google Maps Embed URL (iframe src)</label>
          <input
            value={config.mapConfig?.embedUrl || ""}
            onChange={(e) => setConfig({ ...config, mapConfig: { ...config.mapConfig, embedUrl: e.target.value } })}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block mb-1">Store Visiting Hours Note</label>
          <input
            value={config.mapConfig?.visitingHours || ""}
            onChange={(e) => setConfig({ ...config, mapConfig: { ...config.mapConfig, visitingHours: e.target.value } })}
            className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-md transition"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save General Settings"}
        </button>
      </form>

      {/* 2. Contact Cards CRUD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">2. Active Contact Channel Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(config.carouselCards || []).map((card) => (
            <div key={card._id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-start">
              <div>
                <p className="font-bold text-xs text-slate-800">{card.title}</p>
                <p className="text-xs font-black text-indigo-600 mt-1">{card.contact}</p>
                <p className="text-[10px] text-slate-400">{card.contactSub}</p>
              </div>
              <button
                onClick={() => handleDeleteCard(card._id)}
                className="text-rose-500 hover:text-rose-600 p-1"
                title="Delete Card"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Card Form */}
        <form onSubmit={handleAddCard} className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
          <div>
            <label className="block mb-1">Channel Title *</label>
            <input
              placeholder="e.g. WhatsApp Priority Chat"
              value={newCard.title}
              onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Contact String *</label>
            <input
              placeholder="e.g. +91 98765 43210"
              value={newCard.contact}
              onChange={(e) => setNewCard({ ...newCard, contact: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Action Link (tel / wa.me / mailto)</label>
            <input
              placeholder="https://wa.me/918187921060"
              value={newCard.action}
              onChange={(e) => setNewCard({ ...newCard, action: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Subtext / Timing</label>
            <input
              placeholder="Instant reply within 2 minutes"
              value={newCard.contactSub}
              onChange={(e) => setNewCard({ ...newCard, contactSub: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1.5 transition">
              <Plus className="w-4 h-4" /> Add Channel Card
            </button>
          </div>
        </form>
      </div>

      {/* 3. Dynamic FAQs CRUD */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="font-black text-sm text-slate-900 pb-2 border-b border-slate-100">3. Frequently Asked Questions (Accordion)</h3>
        <div className="space-y-2">
          {(config.faqs || []).map((faq) => (
            <div key={faq._id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <p className="font-bold text-slate-800">{faq.question}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{faq.answer}</p>
              </div>
              <button
                onClick={() => handleDeleteFaq(faq._id)}
                className="text-rose-500 hover:text-rose-600 p-1"
                title="Delete FAQ"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add FAQ Form */}
        <form onSubmit={handleAddFaq} className="pt-4 border-t border-slate-100 space-y-3 text-xs font-bold text-slate-700">
          <div>
            <label className="block mb-1">Question *</label>
            <input
              placeholder="e.g. Return request kaise initiate karein?"
              value={newFaq.question}
              onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1">Answer *</label>
            <textarea
              rows={2}
              placeholder="e.g. 7 dinon ke andar account dashboard se return request place karein."
              value={newFaq.answer}
              onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
              required
            />
          </div>
          <button type="submit" className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-1.5 transition">
            <Plus className="w-4 h-4" /> Add FAQ Item
          </button>
        </form>
      </div>
    </div>
  );
}