import React from "react";
import { CheckCircle2, Printer, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentInvoice({ order, storeName = "KHASTORE" }) {
  if (!order) return null;

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-xl border border-slate-100 print:m-0 print:border-none print:shadow-none">
      <div className="text-center pb-6 border-b border-slate-100">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
        <h2 className="text-xl font-black text-slate-900">Order Placed Successfully!</h2>
        <p className="text-xs text-slate-500 mt-1">Order ID: <b>{order.orderId}</b></p>
      </div>

      <div className="py-6 border-b border-slate-100 grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="text-slate-400 font-bold mb-1">Delivery To:</p>
          <p className="font-bold text-slate-800">{order.shippingDetails?.name}</p>
          <p className="text-slate-600">{order.shippingDetails?.address}</p>
          <p className="text-slate-600">{order.shippingDetails?.city} - {order.shippingDetails?.pincode}</p>
          <p className="text-slate-600">Phone: {order.shippingDetails?.phone}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-400 font-bold mb-1">Store Details:</p>
          <p className="font-bold text-slate-800">{storeName}</p>
          <p className="text-slate-600">Mode: {order.paymentInfo?.mode?.toUpperCase()}</p>
          <p className="text-slate-600">UTR: {order.paymentInfo?.utrNumber}</p>
        </div>
      </div>

      <div className="py-6 border-b border-slate-100">
        <h4 className="font-black text-xs text-slate-800 mb-3">Items Ordered</h4>
        <div className="space-y-2 text-xs">
          {(order.items || []).map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-slate-700">
              <span>{it.name} (x{it.quantity})</span>
              <span className="font-bold">₹{it.total?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="py-4 flex justify-between items-baseline text-sm font-black text-slate-900">
        <span>Grand Total:</span>
        <span className="text-lg text-indigo-600">₹{order.pricing?.totalPayable?.toLocaleString()}</span>
      </div>

      <div className="mt-8 flex gap-3 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-2"
        >
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
        <Link
          to="/"
          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" /> Return Home
        </Link>
      </div>
    </div>
  );
}