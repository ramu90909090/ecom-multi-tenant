import React, { useState, useEffect } from "react";
import API from "../../api/axios";

export default function ContactInquiries() {
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    API.get("/contact/queries").then((res) => {
      if (res.data?.data) setQueries(res.data.data);
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Contact CRM Inquiries</h1>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Phone</th>
              <th className="p-4">Subject</th>
              <th className="p-4">Message</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {queries.map((q) => (
              <tr key={q._id}>
                <td className="p-4 font-bold text-slate-800">{q.name}<p className="text-[10px] text-slate-400 font-normal">{q.email}</p></td>
                <td className="p-4">{q.phone}</td>
                <td className="p-4 font-bold">{q.subject}</td>
                <td className="p-4 max-w-xs truncate">{q.message}</td>
                <td className="p-4 font-black uppercase text-indigo-600">{q.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}