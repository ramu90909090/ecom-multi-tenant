import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  QrCode,
  RefreshCw,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Phone,
  Sparkles,
  Smartphone
} from "lucide-react";

export default function AdminWhatsAppQR() {
  const [sessionInfo, setSessionInfo] = useState({
    status: "DISCONNECTED",
    qrCode: "",
    connectedNumber: ""
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Live session status & QR fetch
  const fetchStatus = async () => {
    try {
      const res = await API.get("/whatsapp/status");
      if (res.data?.success) {
        setSessionInfo({
          status: res.data.status,
          qrCode: res.data.qrCode,
          connectedNumber: res.data.connectedNumber
        });
      }
    } catch (err) {
      console.error("Status fetch error:", err);
    }
  };

  // Har 2.5 second me polling taaki QR aate hi screen par dikhe
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Action: Purane session se reconnect karein
  const handleReconnect = async () => {
    setActionLoading(true);
    try {
      await API.post("/whatsapp/reconnect");
      alert("🔄 Purane saved session se reconnect kiya ja raha hai...");
      fetchStatus();
    } catch (err) {
      alert(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Naya QR generate karein (Fresh session)
  const handleStartNewSession = async () => {
    if (
      window.confirm(
        "Kya aap sach me purana session delete karke naya QR generate karna chahte hain?"
      )
    ) {
      setActionLoading(true);
      try {
        await API.post("/whatsapp/new-session");
        alert("📲 Purana session clear ho gaya. 5 seconds me naya QR screen par aayega...");
        setSessionInfo((prev) => ({ ...prev, status: "RECONNECTING", qrCode: "" }));
        fetchStatus();
      } catch (err) {
        alert(`❌ Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Action: Logout/Disconnect
  const handleLogout = async () => {
    if (window.confirm("Kya aap WhatsApp active session disconnect karna chahte hain?")) {
      setActionLoading(true);
      try {
        await API.post("/whatsapp/logout");
        alert("🔌 WhatsApp disconnect ho gaya.");
        fetchStatus();
      } catch (err) {
        alert(`❌ Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const isConnected = sessionInfo.status === "READY";
  const hasQrCode = !!sessionInfo.qrCode;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      {/* 1. Header & Live Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            WhatsApp Live QR Scanner & Engine
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Scan QR code with your phone to link automatic order and inquiry updates
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-xs ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : hasQrCode
                ? "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                : sessionInfo.status === "RECONNECTING"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-rose-50 text-rose-700 border-rose-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-500"
                  : hasQrCode
                  ? "bg-amber-500"
                  : sessionInfo.status === "RECONNECTING"
                  ? "bg-blue-500"
                  : "bg-rose-500"
              }`}
            />
            <span>Status: {sessionInfo.status}</span>
          </span>

          <button
            onClick={fetchStatus}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Live QR Scan Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: QR Display Area (6 cols) */}
        <div className="md:col-span-6 flex flex-col items-center justify-center p-6 bg-slate-50/80 rounded-3xl border border-slate-200/80 text-center min-h-[320px]">
          {isConnected ? (
            <div className="space-y-4 py-6 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">WhatsApp is Connected!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Active Admin Phone:{" "}
                  <b className="text-emerald-700 font-mono text-sm font-black">
                    +{sessionInfo.connectedNumber || "Verified Device"}
                  </b>
                </p>
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs">
                Store se naye order place hone par customer aur admin ko instant WhatsApp updates dispatch ho rahe hain.
              </p>
            </div>
          ) : hasQrCode ? (
            <div className="space-y-4 animate-in zoom-in-95">
              <div className="p-3 bg-white rounded-2xl border-2 border-indigo-600 shadow-xl inline-block">
                <img
                  src={sessionInfo.qrCode}
                  alt="WhatsApp QR Code"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>
              <div>
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider block">
                  Scan QR with your Phone WhatsApp
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Phone WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8 text-slate-400 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <QrCode className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800">QR Code Generate Karein</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Naya live QR code screen par lane ke liye button dabayein:
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNewSession}
                disabled={actionLoading}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? "Generating QR..." : "📲 Generate Fresh QR Code"}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Control Actions & Step Guides (6 cols) */}
        <div className="md:col-span-6 space-y-5">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Session Action Controls
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              WhatsApp connection manage karne ke liye options:
            </p>
          </div>

          <div className="space-y-3">
            {/* Action 1: Reconnect */}
            <button
              onClick={handleReconnect}
              disabled={actionLoading}
              className="w-full p-3.5 bg-indigo-50/70 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-2xl flex items-center justify-between transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black">Reconnect Saved Session</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Bina QR scan kiye purana session restore karein</p>
                </div>
              </div>
            </button>

            {/* Action 2: Fresh Session / New QR */}
            <button
              onClick={handleStartNewSession}
              disabled={actionLoading}
              className="w-full p-3.5 bg-amber-50/70 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black">Start New Session (New QR)</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Purana cache clear karke naya QR code generate karein</p>
                </div>
              </div>
            </button>

            {/* Action 3: Disconnect */}
            <button
              onClick={handleLogout}
              disabled={actionLoading || !isConnected}
              className="w-full p-3.5 bg-rose-50/70 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-2xl flex items-center justify-between transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Power className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-black">Disconnect / Logout Session</h4>
                  <p className="text-[10px] text-slate-500 font-medium">Active device logout karein</p>
                </div>
              </div>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>Mobile se scan karne ke steps:</span>
            </p>
            <p className="text-[11px] text-slate-500">1. Apne phone me WhatsApp open karein.</p>
            <p className="text-[11px] text-slate-500">2. Three dots (⋮) ya Settings me jakar <b>Linked Devices</b> par tap karein.</p>
            <p className="text-[11px] text-slate-500">3. <b>Link a Device</b> daba kar screen par dikh rahe QR code ko scan karein.</p>
          </div>
        </div>

      </div>
    </div>
  );
}