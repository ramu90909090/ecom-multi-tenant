import React from "react";
import {
  Printer,
  CheckCircle2,
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Home,
  ShieldCheck,
  Phone,
  Mail,
  Download
} from "lucide-react";
import { getImageUrl } from "../../utils/productUtils";

export default function PaymentInvoice({
  order,
  finalOrderData,
  storeName = "KHASTORE",
  onBackHome
}) {
  // Support both 'order' and 'finalOrderData' prop keys
  const data = order || finalOrderData || {};

  const orderId = data.orderId || data._id || "N/A";
  const dateStr =
    data.date ||
    (data.createdAt
      ? new Date(data.createdAt).toLocaleDateString("en-IN", {
          dateStyle: "medium"
        }) +
        " " +
        new Date(data.createdAt).toLocaleTimeString("en-IN", {
          timeStyle: "short"
        })
      : new Date().toLocaleDateString("en-IN"));

  const items = data.items || [];
  const shipping = data.shippingDetails || data.shipping || {};
  const payment = data.paymentInfo || {};
  const pricing = data.pricing || {};

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full bg-slate-50 py-6 px-2 sm:px-6 flex flex-col items-center">
      {/* 1. Print Specific CSS Style Injection */}
      <style>{`
        @media print {
          /* Page ke baaki saare elements hide karein */
          body * {
            visibility: hidden;
          }
          /* Sirf printable invoice card ko visible rakhein */
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Buttons aur browser bars print me na aayein */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 2. Top Interactive Action Bar (Print me hide rahega) */}
      <div className="no-print max-w-2xl w-full flex items-center justify-between gap-3 mb-4 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Order Receipt Ready
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold">
              PDF download karein ya direct print karein
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-pink-500/20 flex items-center space-x-1.5 transition cursor-pointer active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          {onBackHome && (
            <button
              onClick={onBackHome}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center space-x-1"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Printable Invoice Card */}
      <div
        id="printable-invoice"
        className="max-w-2xl w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-10 space-y-6 text-slate-800"
      >
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-100 gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-50 text-pink-600 border border-pink-200 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Official Tax Invoice</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              {storeName}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Authorized E-Commerce Store Receipt & Warranty Slip
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Order Identifier
            </span>
            <h3 className="text-base font-black text-slate-900 font-mono">
              #{orderId}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center sm:justify-end gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateStr}</span>
            </p>
          </div>
        </div>

        {/* Customer & Payment Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
          {/* Shipping Info */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Delivery Details</span>
            </span>
            <p className="font-extrabold text-slate-900 text-sm">
              {shipping.name || "Customer"}
            </p>
            <p className="text-slate-600 font-medium leading-relaxed">
              {shipping.address ? `${shipping.address}, ` : ""}
              {shipping.city || ""} {shipping.pincode ? `- ${shipping.pincode}` : ""}
              {shipping.state ? `, ${shipping.state}` : ""}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Mobile: <b className="text-slate-800">{shipping.phone || shipping.mobile || "N/A"}</b>
            </p>
          </div>

          {/* Payment & UTR Info */}
          <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-violet-500" />
              <span>Payment Summary</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 uppercase">
                Mode: {payment.mode || data.paymentMode || "UPI"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  payment.status === "Verified"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {payment.status || "Under Verification"}
              </span>
            </div>
            <p className="text-slate-600 font-medium">
              Ref / UTR No:{" "}
              <b className="font-mono text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {payment.utrNumber || data.utrNumber || "N/A"}
              </b>
            </p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Payment verification confirmed by merchant bank
            </p>
          </div>
        </div>

        {/* Ordered Products Table with Thumbnails */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
            Ordered Item(s)
          </h4>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3 text-center">Unit Price</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-4 text-center text-slate-400">
                      Product information available nahi hai.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => {
                    const itemImg =
                      it.image ||
                      (Array.isArray(it.images) ? it.images[0] : "") ||
                      "";
                    const itemPrice = Number(it.price || it.finalPrice || 0);
                    const itemQty = Number(it.quantity || 1);
                    const itemTotal = Number(it.total || itemPrice * itemQty);

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 flex items-center space-x-3">
                          <img
                            src={getImageUrl(itemImg)}
                            alt={it.name}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                            onError={(e) => {
                              e.target.src =
                                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80";
                            }}
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block line-clamp-1">
                              {it.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              SKU: PRD-{idx + 101}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-800">
                          ₹{itemPrice.toLocaleString()}
                        </td>
                        <td className="p-3 text-center font-black text-slate-900">
                          {itemQty}
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ₹{itemTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Breakdown & Digital Stamp */}
        <div className="flex flex-col sm:flex-row justify-between items-end gap-6 pt-2">
          {/* Terms / Digital Stamp */}
          <div className="text-[10px] text-slate-400 font-semibold space-y-1.5 max-w-xs text-left">
            <p className="font-black text-slate-700 uppercase tracking-wider">
              Terms & Conditions:
            </p>
            <p>1. Receipt dispatch confirmation & proof of purchase hai.</p>
            <p>2. Physical delivery 2-4 business days me complete hogi.</p>
            <p>3. WhatsApp updates registered mobile number par send kiye jayenge.</p>
          </div>

          {/* Calculation Summary Card */}
          <div className="w-full sm:w-64 space-y-2 text-xs text-slate-600 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
            <div className="flex justify-between">
              <span>Items Subtotal:</span>
              <span className="font-bold text-slate-800">
                ₹{Number(pricing.subtotal || data.itemsSubtotal || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>GST (18% Calculated):</span>
              <span className="font-bold text-slate-800">
                ₹{Number(pricing.gstAmount || data.gstAmount || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span className="font-bold text-emerald-600">
                {(pricing.deliveryFee ?? data.deliveryFee) === 0
                  ? "FREE"
                  : `₹${pricing.deliveryFee || data.deliveryFee}`}
              </span>
            </div>

            {(pricing.couponDiscount || data.couponDiscount) > 0 && (
              <div className="flex justify-between text-pink-600 font-bold">
                <span>Coupon Discount:</span>
                <span>-₹{Number(pricing.couponDiscount || data.couponDiscount).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-sm">
              <span className="font-black text-slate-900 uppercase tracking-tight">
                Net Total:
              </span>
              <span className="text-lg font-black text-indigo-700">
                ₹{Number(pricing.totalPayable || data.netPayable || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Guarantee Bar */}
        <div className="pt-4 border-t border-slate-100 text-center text-[11px] font-bold text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Thank you for shopping with {storeName}! Keep this slip for warranty support.</span>
        </div>
      </div>
    </div>
  );
}