import React from "react";

export default function PaymentShippingForm({ shippingDetails, setShippingDetails }) {
  const handleChange = (e) => {
    setShippingDetails({ ...shippingDetails, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6">
      <h3 className="text-sm font-black text-slate-800 mb-4">1. Delivery Address</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold text-slate-700">
        <div>
          <label className="block mb-1">Recipient Name *</label>
          <input
            name="name"
            value={shippingDetails.name}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block mb-1">WhatsApp / Phone *</label>
          <input
            name="phone"
            value={shippingDetails.phone}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-1">Email Address *</label>
          <input
            name="email"
            type="email"
            value={shippingDetails.email}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block mb-1">House No, Street, Landmark *</label>
          <input
            name="address"
            value={shippingDetails.address}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block mb-1">City / District *</label>
          <input
            name="city"
            value={shippingDetails.city}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Pincode *</label>
          <input
            name="pincode"
            value={shippingDetails.pincode}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5"
            required
          />
        </div>
      </div>
    </div>
  );
}