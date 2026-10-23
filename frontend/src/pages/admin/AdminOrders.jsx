import React, { useState, useEffect } from "react";
import API from "../../api/axios";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    const res = await API.get("/orders");
    if (res.data?.data) setOrders(res.data.data);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id, orderStatus, paymentStatus) => {
    await API.put(`/orders/${id}`, { orderStatus, paymentStatus });
    fetchOrders();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Orders & Delivery CRM</h1>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">UTR</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((ord) => (
              <tr key={ord._id}>
                <td className="p-4 font-black text-slate-900">{ord.orderId}</td>
                <td className="p-4">
                  <p className="font-bold text-slate-800">{ord.shippingDetails?.name}</p>
                  <p className="text-[10px] text-slate-400">{ord.shippingDetails?.phone}</p>
                </td>
                <td className="p-4 font-bold text-slate-900">₹{ord.pricing?.totalPayable?.toLocaleString()}</td>
                <td className="p-4 font-mono font-bold text-slate-700">{ord.paymentInfo?.utrNumber}</td>
                <td className="p-4">
                  <select
                    value={ord.paymentInfo?.status}
                    onChange={(e) => updateStatus(ord._id, ord.orderStatus, e.target.value)}
                    className="border border-slate-200 rounded-lg p-1 font-bold text-[11px]"
                  >
                    <option>Processing</option>
                    <option>Verified</option>
                    <option>Rejected</option>
                    <option>Not Verified</option>
                  </select>
                </td>
                <td className="p-4">
                  <select
                    value={ord.orderStatus}
                    onChange={(e) => updateStatus(ord._id, e.target.value, ord.paymentInfo?.status)}
                    className="border border-slate-200 rounded-lg p-1 font-bold text-[11px]"
                  >
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                    <option>Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}