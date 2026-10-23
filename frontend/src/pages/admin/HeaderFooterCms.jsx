import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import { getImageUrl } from "../../utils/productUtils";
import { Upload, Save } from "lucide-react";

export default function HeaderFooterCms() {
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);

  // File Upload State
  const [navbarLogoFile, setNavbarLogoFile] = useState(null);
  const [footerLogoFile, setFooterLogoFile] = useState(null);
  const [paymentQrFile, setPaymentQrFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);

  useEffect(() => {
    API.get("/settings").then((res) => {
      if (res.data?.data) setSettings(res.data.data);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("settingsData", JSON.stringify(settings));

      if (navbarLogoFile) formData.append("navbarLogo", navbarLogoFile);
      if (footerLogoFile) formData.append("footerLogo", footerLogoFile);
      if (paymentQrFile) formData.append("paymentQrFile", paymentQrFile);
      if (faviconFile) formData.append("faviconFile", faviconFile);

      const res = await API.put("/settings", formData);
      if (res.data?.success) {
        alert("✅ Site Settings, Logos & Payment QR successfully updated!");
        setSettings(res.data.data);
      }
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-8 text-xs font-bold text-slate-400">Loading CMS...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Header, Footer & UPI Studio</h1>

      <form onSubmit={handleSave} className="space-y-6 text-xs font-bold text-slate-700">
        {/* Navbar Studio */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-slate-900">1. Navbar & Header Branding</h3>
          <div>
            <label className="block mb-1">Brand Name</label>
            <input
              value={settings.navbar?.brandName || ""}
              onChange={(e) => setSettings({ ...settings, navbar: { ...settings.navbar, brandName: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Brand Subtitle</label>
            <input
              value={settings.navbar?.brandSubtitle || ""}
              onChange={(e) => setSettings({ ...settings, navbar: { ...settings.navbar, brandSubtitle: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Upload Navbar Logo Image</label>
            <input
              type="file"
              onChange={(e) => setNavbarLogoFile(e.target.files[0])}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
            {settings.navbar?.logoUrl && (
              <img src={getImageUrl(settings.navbar.logoUrl)} alt="Current Logo" className="h-10 mt-2 object-contain rounded" />
            )}
          </div>
        </div>

        {/* Payment Gateway UPI & QR Image */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-slate-900">2. Payment Gateway & Custom QR</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1">UPI ID</label>
              <input
                value={settings.paymentGateway?.upiId || ""}
                onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, upiId: e.target.value } })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-1">Merchant Name</label>
              <input
                value={settings.paymentGateway?.merchantName || ""}
                onChange={(e) => setSettings({ ...settings, paymentGateway: { ...settings.paymentGateway, merchantName: e.target.value } })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block mb-1">Upload Custom Bank QR Code Image</label>
            <input
              type="file"
              onChange={(e) => setPaymentQrFile(e.target.files[0])}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
            {settings.paymentGateway?.qrImageUrl && (
              <img src={getImageUrl(settings.paymentGateway.qrImageUrl)} alt="QR" className="w-24 h-24 mt-2 object-contain rounded border border-slate-200" />
            )}
          </div>
        </div>

        {/* Footer Studio */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black text-sm text-slate-900">3. Footer Details</h3>
          <div>
            <label className="block mb-1">Footer Description</label>
            <textarea
              rows={3}
              value={settings.footer?.description || ""}
              onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, description: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1">Copyright Notice</label>
            <input
              value={settings.footer?.copyrightText || ""}
              onChange={(e) => setSettings({ ...settings, footer: { ...settings.footer, copyrightText: e.target.value } })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving Changes..." : "Save All Configuration"}
        </button>
      </form>
    </div>
  );
}