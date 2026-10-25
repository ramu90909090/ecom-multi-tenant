import React, { useState, useEffect } from "react";
import {
  Save,
  Mail,
  Server,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Loader2,
  ShieldCheck
} from "lucide-react";
import API from "../../api/axios";
import { useSettings } from "../../context/SettingsContext";
import { getImageUrl } from "../../utils/productUtils";

export default function HeaderFooterCms() {
  const { settings, fetchSettings } = useSettings();
  const [formData, setFormData] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState("mail-server"); // Default to mailing partner for quick access
  const [navbarLogoFile, setNavbarLogoFile] = useState(null);

  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Test Mail State
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isTestingMail, setIsTestingMail] = useState(false);
  const [mailTestMsg, setMailTestMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    if (settings) {
      const cloned = JSON.parse(JSON.stringify(settings));
      // Ensure mailConfig structure exists
      if (!cloned.mailConfig) {
        cloned.mailConfig = {
          activeProvider: "mailcow",
          gmail: { user: "", pass: "", fromName: cloned.navbar?.brandName || "Store Support" },
          mailcow: {
            host: "mail.uprcart.com",
            port: 587,
            secure: false,
            user: "support@uprcart.com",
            pass: "",
            fromEmail: "support@uprcart.com",
            fromName: "UPRCART Mailer"
          }
        };
      }
      setFormData(cloned);
    }
  }, [settings]);

  if (!formData) {
    return (
      <div className="p-12 text-center text-xs font-bold text-gray-400">
        Loading Configuration...
      </div>
    );
  }

  const handleSave = async (e) => {
    e?.preventDefault();
    setIsSaving(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const payload = new FormData();
      payload.append("settingsData", JSON.stringify(formData));

      if (navbarLogoFile) {
        payload.append("navbarLogo", navbarLogoFile);
      }

      const res = await API.put("/settings", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        setStatusMsg({ type: "success", text: "Settings successfully updated & live on server!" });
        setNavbarLogoFile(null);
        if (res.data.data) {
          setFormData(JSON.parse(JSON.stringify(res.data.data)));
        }
        fetchSettings();
      }
    } catch (err) {
      setStatusMsg({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update settings"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMail = async () => {
    if (!testEmailAddress.trim()) {
      alert("Kripya test email recipient address dalein.");
      return;
    }
    setIsTestingMail(true);
    setMailTestMsg({ type: "", text: "" });

    try {
      const res = await API.post("/settings/test-mail", {
        config: formData.mailConfig,
        targetEmail: testEmailAddress.trim()
      });

      if (res.data?.success) {
        setMailTestMsg({ type: "success", text: res.data.message });
      }
    } catch (err) {
      setMailTestMsg({
        type: "error",
        text: err.response?.data?.message || "SMTP Connection Failed"
      });
    } finally {
      setIsTestingMail(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* 1. Header with Save Action */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Store Settings & CMS Hub</h1>
          <p className="text-xs text-gray-500 mt-1">
            Mailing Server (Gmail / Mailcow), Navbar branding, UPI payment aur Footer settings manage karein.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 active:scale-95 transition cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
        </button>
      </div>

      {/* Notification */}
      {statusMsg.text && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-rose-50 border-rose-200 text-rose-700"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 2. Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { id: "mail-server", label: "Mailing Partner (Gmail vs Mailcow)" },
          { id: "navbar", label: "Navbar Identity & Logo" },
          { id: "payment-qr", label: "Bank UPI Settings" },
          { id: "footer-brand", label: "Footer Brand & Description" },
          { id: "footer-trust", label: "Footer Trust Guarantees" },
          { id: "footer-info", label: "Customer Desk & Socials" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              activeTab === tab.id
                ? "bg-pink-600 text-white shadow-md shadow-pink-500/20"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DYNAMIC MAILING PARTNER (GMAIL VS MAILCOW)         */}
      {/* ======================================================== */}
      {activeTab === "mail-server" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-base font-black text-gray-900 flex items-center space-x-2">
              <Server className="w-5 h-5 text-indigo-600" />
              <span>Select Active Mailing Partner</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Google ke email limits se bachne ke liye aap jab chahe Mailcow (mail.uprcart.com) ya Gmail switch kar sakte hain.
            </p>
          </div>

          {/* Provider Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mailcow Card */}
            <div
              onClick={() =>
                setFormData({
                  ...formData,
                  mailConfig: { ...formData.mailConfig, activeProvider: "mailcow" }
                })
              }
              className={`p-5 rounded-3xl border-2 transition cursor-pointer relative ${
                formData.mailConfig?.activeProvider === "mailcow"
                  ? "border-indigo-600 bg-indigo-50/40 shadow-md ring-2 ring-indigo-500/20"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/60"
              }`}
            >
              {formData.mailConfig?.activeProvider === "mailcow" && (
                <span className="absolute top-4 right-4 bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  ACTIVE
                </span>
              )}
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Mailcow Self-Hosted</h3>
                  <p className="text-[11px] font-bold text-indigo-600">mail.uprcart.com (No Restrictions)</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Aapka khud ka private mailing server. Unlimited bulk emails, zero third-party blocking aur high delivery rate.
              </p>
            </div>

            {/* Gmail Card */}
            <div
              onClick={() =>
                setFormData({
                  ...formData,
                  mailConfig: { ...formData.mailConfig, activeProvider: "gmail" }
                })
              }
              className={`p-5 rounded-3xl border-2 transition cursor-pointer relative ${
                formData.mailConfig?.activeProvider === "gmail"
                  ? "border-pink-600 bg-pink-50/40 shadow-md ring-2 ring-pink-500/20"
                  : "border-gray-200 bg-gray-50/50 hover:bg-gray-100/60"
              }`}
            >
              {formData.mailConfig?.activeProvider === "gmail" && (
                <span className="absolute top-4 right-4 bg-pink-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                  ACTIVE
                </span>
              )}
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Google Gmail SMTP</h3>
                  <p className="text-[11px] font-bold text-pink-600">smtp.gmail.com (500 mails/day)</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Google standard app password method. Small volume notifications ke liye accha hai.
              </p>
            </div>
          </div>

          {/* Form Fields: Mailcow Specific */}
          {formData.mailConfig?.activeProvider === "mailcow" && (
            <div className="p-6 rounded-3xl bg-indigo-50/40 border border-indigo-100 space-y-4">
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Mailcow Server Configuration (mail.uprcart.com)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                <div>
                  <label className="block text-gray-700 mb-1">Mailcow SMTP Host</label>
                  <input
                    type="text"
                    value={formData.mailConfig.mailcow?.host || "mail.uprcart.com"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          mailcow: { ...formData.mailConfig.mailcow, host: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Port (587 STARTTLS / 465 SSL)</label>
                  <input
                    type="number"
                    value={formData.mailConfig.mailcow?.port || 587}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          mailcow: { ...formData.mailConfig.mailcow, port: Number(e.target.value) }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. UPRCART Store"
                    value={formData.mailConfig.mailcow?.fromName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          mailcow: { ...formData.mailConfig.mailcow, fromName: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-gray-700 mb-1">Mailbox Username / Email</label>
                  <input
                    type="email"
                    placeholder="support@uprcart.com"
                    value={formData.mailConfig.mailcow?.user || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          mailcow: {
                            ...formData.mailConfig.mailcow,
                            user: e.target.value,
                            fromEmail: e.target.value
                          }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-gray-700 mb-1">Mailbox Password</label>
                  <input
                    type="password"
                    placeholder="Mailcow Mailbox Password"
                    value={formData.mailConfig.mailcow?.pass || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          mailcow: { ...formData.mailConfig.mailcow, pass: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Form Fields: Gmail Specific */}
          {formData.mailConfig?.activeProvider === "gmail" && (
            <div className="p-6 rounded-3xl bg-pink-50/40 border border-pink-100 space-y-4">
              <h3 className="text-xs font-black text-pink-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Mail className="w-4 h-4 text-pink-600" />
                <span>Google Gmail SMTP Configuration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-bold">
                <div>
                  <label className="block text-gray-700 mb-1">Gmail Address</label>
                  <input
                    type="email"
                    placeholder="e.g. store@gmail.com"
                    value={formData.mailConfig.gmail?.user || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          gmail: { ...formData.mailConfig.gmail, user: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Google App Password (16-char)</label>
                  <input
                    type="password"
                    placeholder="xxxx xxxx xxxx xxxx"
                    value={formData.mailConfig.gmail?.pass || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          gmail: { ...formData.mailConfig.gmail, pass: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Store Support"
                    value={formData.mailConfig.gmail?.fromName || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mailConfig: {
                          ...formData.mailConfig,
                          gmail: { ...formData.mailConfig.gmail, fromName: e.target.value }
                        }
                      })
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Test SMTP Connection Box */}
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Verify & Send Live Test Email
            </h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter recipient email to verify (e.g. test@gmail.com)..."
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleTestMail}
                disabled={isTestingMail}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50 shrink-0"
              >
                {isTestingMail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isTestingMail ? "Verifying..." : "Send Test Mail"}</span>
              </button>
            </div>

            {mailTestMsg.text && (
              <p
                className={`text-xs font-bold mt-1 ${
                  mailTestMsg.type === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {mailTestMsg.text}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: NAVBAR IDENTITY & LOGO                             */}
      {/* ======================================================== */}
      {activeTab === "navbar" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">Top Navbar Configuration</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="block text-gray-700 mb-1">Navbar Brand Name</label>
              <input
                type="text"
                value={formData.navbar?.brandName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    navbar: { ...formData.navbar, brandName: e.target.value }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:border-pink-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">Navbar Subtitle Tagline</label>
              <input
                type="text"
                value={formData.navbar?.brandSubtitle || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    navbar: { ...formData.navbar, brandSubtitle: e.target.value }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:bg-white focus:border-pink-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-gray-700">Navbar Brand Logo (File Upload ya URL)</label>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                {navbarLogoFile ? (
                  <img
                    src={URL.createObjectURL(navbarLogoFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : formData.navbar?.logoUrl ? (
                  <img
                    src={getImageUrl(formData.navbar.logoUrl)}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles className="w-6 h-6 text-pink-500" />
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNavbarLogoFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100 cursor-pointer"
                />
                <input
                  type="url"
                  placeholder="Or enter direct web logo URL..."
                  value={formData.navbar?.logoUrl || ""}
                  onChange={(e) => {
                    setNavbarLogoFile(null);
                    setFormData({
                      ...formData,
                      navbar: { ...formData.navbar, logoUrl: e.target.value }
                    });
                  }}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BANK UPI SETTINGS                                 */}
      {/* ======================================================== */}
      {activeTab === "payment-qr" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">Bank Account UPI Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="block text-gray-700 mb-1">Receiver UPI ID / VPA *</label>
              <input
                type="text"
                placeholder="e.g. juhip2019@okaxis"
                value={formData.paymentGateway?.upiId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentGateway: { ...formData.paymentGateway, upiId: e.target.value }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Merchant / Account Holder Name *</label>
              <input
                type="text"
                placeholder="e.g. Juhi Pafhj"
                value={formData.paymentGateway?.merchantName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentGateway: { ...formData.paymentGateway, merchantName: e.target.value }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Cash on Delivery (COD) Minimum Amount (₹)</label>
              <input
                type="number"
                placeholder="5000"
                value={formData.paymentGateway?.codMinAmount ?? 5000}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentGateway: { ...formData.paymentGateway, codMinAmount: Number(e.target.value) }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: FOOTER BRAND & DESCRIPTION                        */}
      {/* ======================================================== */}
      {activeTab === "footer-brand" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">Footer Brand & Description</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
            <div>
              <label className="block text-gray-700 mb-1">Footer Brand Name</label>
              <input
                type="text"
                value={formData.footer?.brandName || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: { ...formData.footer, brandName: e.target.value }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Footer Subtitle Tagline</label>
              <input
                type="text"
                value={formData.footer?.brandSubtitle || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: { ...formData.footer, brandSubtitle: e.target.value }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Footer Main Description</label>
            <textarea
              rows={4}
              value={formData.footer?.description || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  footer: { ...formData.footer, description: e.target.value }
                })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none text-xs"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: FOOTER TRUST GUARANTEES                           */}
      {/* ======================================================== */}
      {activeTab === "footer-trust" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">Trust Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(formData.footer?.trustGuarantees || []).map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <span className="font-black text-pink-600 text-[10px]">Badge #{idx + 1}</span>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const updated = [...formData.footer.trustGuarantees];
                    updated[idx].title = e.target.value;
                    setFormData({ ...formData, footer: { ...formData.footer, trustGuarantees: updated } });
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2 font-bold"
                />
                <input
                  type="text"
                  value={item.subtitle}
                  onChange={(e) => {
                    const updated = [...formData.footer.trustGuarantees];
                    updated[idx].subtitle = e.target.value;
                    setFormData({ ...formData, footer: { ...formData.footer, trustGuarantees: updated } });
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: CUSTOMER DESK & SOCIALS                           */}
      {activeTab === "footer-info" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
          <h2 className="text-base font-black text-gray-900 border-b pb-3">Support Contacts & Social Profiles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
            <div>
              <label className="block text-gray-700 mb-1">Office Address</label>
              <input
                type="text"
                value={formData.footer?.customerDesk?.address || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: {
                      ...formData.footer,
                      customerDesk: { ...formData.footer.customerDesk, address: e.target.value }
                    }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Helpdesk Phone</label>
              <input
                type="text"
                value={formData.footer?.customerDesk?.phone || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: {
                      ...formData.footer,
                      customerDesk: { ...formData.footer.customerDesk, phone: e.target.value }
                    }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                value={formData.footer?.customerDesk?.email || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    footer: {
                      ...formData.footer,
                      customerDesk: { ...formData.footer.customerDesk, email: e.target.value }
                    }
                  })
                }
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}