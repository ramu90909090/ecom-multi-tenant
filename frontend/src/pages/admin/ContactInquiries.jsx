import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  FileText
} from "lucide-react";

export default function ContactInquiries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const res = await API.get("/contact/queries", { params });
      if (res.data?.success) {
        setQueries(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchQueries();
  };

  const handleStatusChange = async (id, newStatus, currentNotes) => {
    try {
      const res = await API.patch(`/contact/queries/${id}`, {
        status: newStatus,
        adminNotes: currentNotes
      });
      if (res.data?.success) {
        alert(`✅ Status changed to ${newStatus}. WhatsApp & Email alert sent!`);
        fetchQueries();
        if (selectedTicket?._id === id) {
          setSelectedTicket(res.data.data);
        }
      }
    } catch (err) {
      alert(`❌ Status update failed: ${err.message}`);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setUpdating(true);
    try {
      const res = await API.patch(`/contact/queries/${selectedTicket._id}`, {
        status: selectedTicket.status,
        adminNotes
      });
      if (res.data?.success) {
        alert("✅ Memo saved & Customer updated!");
        fetchQueries();
        setSelectedTicket(res.data.data);
      }
    } catch (err) {
      alert(`❌ Note save error: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ticket?")) {
      try {
        await API.delete(`/contact/queries/${id}`);
        fetchQueries();
        if (selectedTicket?._id === id) setSelectedTicket(null);
      } catch (err) {
        alert(`❌ Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Support Inquiry CRM</h1>
          <p className="text-xs text-slate-400 font-bold mt-1">
            Real-time multi-tenant customer support ticket desk
          </p>
        </div>

        {/* Stats Pill Counters */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-xl border border-amber-200">
            Pending: {stats.pending}
          </span>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200">
            In Progress: {stats.inProgress}
          </span>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
            Resolved: {stats.resolved}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, email, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main CRM Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
            <tr>
              <th className="p-4">Customer</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Subject & Message</th>
              <th className="p-4">Status & Trigger</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-xs font-bold text-slate-400">
                  Loading Tickets...
                </td>
              </tr>
            ) : queries.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-xs font-bold text-slate-400">
                  Koi support ticket nahi mila.
                </td>
              </tr>
            ) : (
              queries.map((q) => (
                <tr key={q._id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-bold text-slate-800">
                    {q.name}
                    <p className="text-[10px] text-slate-400 font-normal">{q.email}</p>
                  </td>
                  <td className="p-4 font-bold text-indigo-600">{q.phone}</td>
                  <td className="p-4 max-w-xs">
                    <span className="font-bold text-slate-800 block">{q.subject}</span>
                    <span className="text-[11px] text-slate-400 line-clamp-1">{q.message}</span>
                  </td>
                  <td className="p-4">
                    <select
                      value={q.status}
                      onChange={(e) => handleStatusChange(q._id, e.target.value, q.adminNotes)}
                      className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg border outline-none cursor-pointer ${
                        q.status === "Resolved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : q.status === "In Progress"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : q.status === "Closed"
                          ? "bg-slate-100 text-slate-700 border-slate-300"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTicket(q);
                        setAdminNotes(q.adminNotes || "");
                      }}
                      className="p-1.5 text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition"
                      title="View & Reply"
                    >
                      <MessageSquare className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(q._id)}
                      className="p-1.5 text-rose-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details & Notes Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Ticket #{selectedTicket._id.toString().slice(-6).toUpperCase()}
                </h3>
                <p className="text-xs text-slate-400">
                  Customer: <b>{selectedTicket.name}</b> ({selectedTicket.phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl text-xs space-y-2">
              <p className="font-bold text-slate-800">Subject: {selectedTicket.subject}</p>
              <p className="text-slate-600 leading-relaxed font-normal">"{selectedTicket.message}"</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Response / Notes (Customer ko WhatsApp/Email me jayega)
              </label>
              <textarea
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Type resolution memo or reason..."
                className="w-full border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={updating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {updating ? "Sending Notification..." : "Update & Notify Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}