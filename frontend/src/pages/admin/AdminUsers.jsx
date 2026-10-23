import React, { useState, useEffect } from "react";
import API from "../../api/axios";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.get("/users").then((res) => {
      if (res.data?.data) setUsers(res.data.data);
    });
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-slate-900 mb-6">Registered Customers & Staff</h1>
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">Role</th>
              <th className="p-4">Verified</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="p-4 font-bold text-slate-800">
                  {u.name} <p className="text-[10px] text-slate-400 font-normal">{u.email}</p>
                </td>
                <td className="p-4">{u.mobile}</td>
                <td className="p-4 uppercase font-bold text-indigo-600">{u.role}</td>
                <td className="p-4">{u.isVerified ? "✅ Yes" : "❌ No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}