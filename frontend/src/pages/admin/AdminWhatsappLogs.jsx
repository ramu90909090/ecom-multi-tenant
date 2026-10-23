import React, { useState, useEffect } from "react";
import API from "../../api/axios";

export default function AdminWhatsappLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    API.get("/whatsapp/logs").then((res) => {
      if (res.data?.data) setLogs(res.data.data);
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">WhatsApp Dispatch Logs</h1>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Recipient</th>
              <th className="p-4">Trigger</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((l) => (
              <tr key={l._id}>
                <td className="p-4 font-black">{l.orderId}</td>
                <td className="p-4">{l.recipientNumber}</td>
                <td className="p-4 uppercase text-[10px] font-bold">{l.triggerType}</td>
                <td className="p-4 font-bold text-emerald-600">{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}