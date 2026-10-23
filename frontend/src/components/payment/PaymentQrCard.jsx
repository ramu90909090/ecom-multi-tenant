import React from "react";
import { QrCode, Copy } from "lucide-react";
import { getImageUrl } from "../../utils/productUtils";

export default function PaymentQrCard({ upiId, merchantName, totalPayable, customQrUrl }) {
  const upiIntentString = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${totalPayable}&cu=INR`;
  const qrImageSrc = customQrUrl
    ? getImageUrl(customQrUrl)
    : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiIntentString)}`;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black uppercase mb-4">
        <QrCode className="w-3.5 h-3.5" /> Instant Scan & Pay
      </div>

      <div className="w-48 h-48 mx-auto bg-slate-50 border border-slate-200 p-2 rounded-2xl mb-4">
        <img src={qrImageSrc} alt="Payment QR" className="w-full h-full object-contain rounded-xl" />
      </div>

      <p className="text-xs font-bold text-slate-800">{merchantName}</p>
      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 mt-1">
        <span>UPI: <b>{upiId}</b></span>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(upiId)}
          className="text-indigo-600 hover:text-indigo-700"
          title="Copy UPI"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}