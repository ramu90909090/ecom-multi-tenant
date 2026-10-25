import React from "react";
import { QrCode, ShieldCheck, AlertTriangle } from "lucide-react";
import { useSettings } from "../../context/SettingsContext";
import { getImageUrl } from "../../utils/productUtils";

export default function PaymentQrCard({ totalAmount, orderId }) {
  const { settings } = useSettings();

  const upiId = settings?.paymentGateway?.upiId || "juhip2019@okaxis";
  const merchantName = settings?.paymentGateway?.merchantName || "Juhi Pafhj";
  const customQrImage = settings?.paymentGateway?.qrImageUrl;
  const verificationNote =
    settings?.paymentGateway?.verificationNote ||
    `Payment karte waqt verify karein ki receiver UPI ID ${upiId} (Name: ${merchantName}) hi show ho rahi ho.`;

  // Fallback Dynamic Live UPI URL
  const generatedUpiString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    merchantName
  )}&am=${totalAmount}&cu=INR&tn=Order%20${orderId || "Payment"}`;

  const fallbackLiveQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    generatedUpiString
  )}`;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 space-y-4 shadow-sm text-center">
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-100">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>Official Verified Payment Scanner</span>
      </div>

      <div className="w-56 h-56 mx-auto bg-slate-50 rounded-2xl border-2 border-slate-200 p-3 flex items-center justify-center overflow-hidden shadow-inner">
        {customQrImage ? (
          <img
            src={getImageUrl(customQrImage)}
            alt="Bank QR"
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={fallbackLiveQrUrl}
            alt="Live UPI QR"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Receiver UPI VPA</p>
        <p className="text-base font-black text-slate-900 font-mono">{upiId}</p>
        <p className="text-xs text-indigo-600 font-extrabold">Name: {merchantName}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-left flex items-start space-x-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
          {verificationNote}
        </p>
      </div>
    </div>
  );
}