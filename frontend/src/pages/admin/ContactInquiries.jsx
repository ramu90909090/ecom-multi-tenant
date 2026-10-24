import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  Search,
  Trash2,
  CheckCircle,
  Clock,
  Filter,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Send,
  Eye
} from "lucide-react";

export default function ContactInquiries() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selection for Bulk Delete
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination (10, 25, 50, 100)
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0
  });

  // Modal View / Admin Note State
  const [activeTicket, setActiveTicket] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [ticketStatus, setTicketStatus] = useState("Pending");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "All") params.append("status", statusFilter);
      params.append("page", currentPage);
      params.append("limit", limit);

      const res = await API.get(`/contact/queries?${params.toString()}`);
      if (res.data?.success) {
        setQueries(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch queries error:", err);
    } finally {
      setLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [currentPage, limit, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchQueries();
  };

  // Status Change directly from row dropdown
  const handleStatusChange = async (id, newStatus) => {
    try {
      await API.patch(`/contact/queries/${id}`, { status: newStatus });
      fetchQueries();
    } catch (err) {
      alert(`❌ Status update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  // Single Ticket Delete
  const handleDeleteSingle = async (id) => {
    if (window.confirm("Kya aap sach me is inquiry ticket ko delete karna chahte hain?")) {
      try {
        await API.delete(`/contact/queries/${id}`);
        fetchQueries();
      } catch (err) {
        alert(`❌ Delete failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Bulk Delete Selected
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Kya aap chune gaye ${selectedIds.length} tickets ko permanent delete karna chahte hain?`
      )
    ) {
      try {
        const res = await API.delete("/contact/queries/bulk-delete", {
          data: { ticketIds: selectedIds }
        });
        alert(res.data?.message || "Tickets deleted successfully!");
        fetchQueries();
      } catch (err) {
        alert(`❌ Bulk Delete failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Clean All Closed Tickets
  const handleCleanAllClosed = async () => {
    if (
      window.confirm("Kya aap database se saare 'Closed' aur 'Resolved' tickets ko delete karna chahte hain?")
    ) {
      try {
        const res = await API.delete("/contact/queries/bulk-delete", {
          data: { deleteAllClosed: true }
        });
        alert(res.data?.message || "Saare closed tickets delete ho gaye!");
        fetchQueries();
      } catch (err) {
        alert(`❌ Action failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Open Full Detail Modal
  const handleOpenDetailModal = (q) => {
    setActiveTicket(q);
    setNoteText(q.adminNotes || "");
    setTicketStatus(q.status || "Pending");
  };

  // Save Modal Updates
  const handleSaveTicketModal = async () => {
    if (!activeTicket) return;
    setIsUpdating(true);
    try {
      await API.patch(`/contact/queries/${activeTicket._id}`, {
        status: ticketStatus,
        adminNotes: noteText
      });
      alert("✅ Ticket information aur note save ho gaya!");
      setActiveTicket(null);
      fetchQueries();
    } catch (err) {
      alert(`❌ Save failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Checkbox Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(queries.map((q) => q._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "In Progress":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Closed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      
      {/* 1. Header & Live Analytics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Inquiries & Support Tickets (CRM)
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Manage customer complaints, response notes, ticket resolution & bulk cleanups
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCleanAllClosed}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-rose-200"
            title="Clean resolved and closed tickets"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Clean Closed Tickets</span>
          </button>

          <button
            onClick={fetchQueries}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Tickets</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Pending Review</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">In Progress</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.inProgress}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Resolved & Closed</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.resolved}</h3>
          </div>
        </div>
      </div>

      {/* 2. Search Toolbar, Status Filter & Limits */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box (6 cols) */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search user name, email, phone, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-16 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none transition"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-black transition cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Status Filter (3 cols) */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Ticket Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Limit: 10, 25, 50, 100 (3 cols) */}
          <div className="md:col-span-3 flex items-center justify-end space-x-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-2 px-2.5 bg-indigo-50/70 border border-indigo-200 text-indigo-700 font-black rounded-xl text-xs outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>

        </div>

        {/* Bulk Action & Reset Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 ? (
              <div className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl border border-pink-200">
                <span className="font-bold">{selectedIds.length} tickets selected</span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            ) : (
              <span className="text-slate-400 font-semibold text-[11px]">
                Checkbox select karke multiple inquiry tickets ek sath delete karein.
              </span>
            )}
          </div>

          {(search || statusFilter !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setCurrentPage(1);
              }}
              className="text-pink-600 hover:text-pink-700 font-bold cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Inquiries Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={queries.length > 0 && selectedIds.length === queries.length}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Subject & Message</th>
                <th className="p-4">Ticket Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 font-bold">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching support inquiries...
                  </td>
                </tr>
              ) : queries.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400 font-bold">
                    Koi inquiry match nahi hui. Search clear karein.
                  </td>
                </tr>
              ) : (
                queries.map((q) => {
                  const isSelected = selectedIds.includes(q._id);
                  return (
                    <tr
                      key={q._id}
                      className={`transition ${isSelected ? "bg-indigo-50/40" : "hover:bg-slate-50/60"}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(q._id)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <p className="font-extrabold text-slate-900">{q.name}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <a href={`mailto:${q.email}`} className="hover:underline">{q.email}</a>
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <a href={`tel:${q.phone}`} className="hover:underline">{q.phone}</a>
                        </p>
                      </td>

                      {/* Subject & Message */}
                      <td className="p-4 max-w-sm">
                        <p className="font-black text-slate-900 truncate">{q.subject}</p>
                        <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{q.message}</p>
                        {q.adminNotes && (
                          <div className="mt-1.5 p-1.5 bg-pink-50/80 rounded-lg border border-pink-100 text-[10px] text-pink-700 font-bold">
                            Internal Note: {q.adminNotes}
                          </div>
                        )}
                      </td>

                      {/* Status Dropdown CRUD */}
                      <td className="p-4">
                        <select
                          value={q.status || "Pending"}
                          onChange={(e) => handleStatusChange(q._id, e.target.value)}
                          className={`text-[11px] font-black rounded-xl px-2.5 py-1.5 outline-none border cursor-pointer ${getStatusBadge(
                            q.status
                          )}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>

                      {/* Created At */}
                      <td className="p-4 text-[11px] text-slate-500 font-semibold">
                        {new Date(q.createdAt).toLocaleDateString("en-IN", {
                          dateStyle: "medium"
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenDetailModal(q)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                          title="View Ticket & Add Note"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSingle(q._id)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Complete Server Pagination Bar */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-semibold text-slate-500">
            Showing <b className="text-slate-800">{queries.length}</b> of{" "}
            <b className="text-slate-800">{pagination.total}</b> tickets • Page{" "}
            <b className="text-slate-800">{pagination.page}</b> of{" "}
            <b className="text-slate-800">{pagination.totalPages}</b>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-4 py-1.5 text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl">
              {currentPage} / {pagination.totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentPage(pagination.totalPages)}
              disabled={currentPage >= pagination.totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Detailed Ticket View & CRM Memo Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-lg w-full my-auto max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Support Ticket Review
                </h3>
                <p className="text-[11px] text-slate-400">
                  Received on {new Date(activeTicket.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setActiveTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Overview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1 border border-slate-100">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Customer Contact</span>
              <p className="font-extrabold text-slate-900 text-sm">{activeTicket.name}</p>
              <p className="text-slate-600">Email: <b>{activeTicket.email}</b></p>
              <p className="text-slate-600">Phone: <b>{activeTicket.phone}</b></p>
            </div>

            {/* Inquiry Content */}
            <div className="space-y-1 text-xs">
              <span className="font-bold text-slate-400 uppercase text-[10px]">Message Subject</span>
              <p className="font-black text-slate-900 p-2.5 bg-slate-50 rounded-xl">{activeTicket.subject}</p>
              <span className="font-bold text-slate-400 uppercase text-[10px] block pt-2">Full Message</span>
              <p className="text-slate-700 p-3 bg-slate-50 rounded-xl leading-relaxed whitespace-pre-wrap">
                {activeTicket.message}
              </p>
            </div>

            {/* CRM Status & Admin Notes */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ticket Resolution Status</label>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-bold text-slate-800"
                >
                  <option value="Pending">Pending Review</option>
                  <option value="In Progress">In Progress (Replied)</option>
                  <option value="Resolved">Resolved (Completed)</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Admin Resolution Note</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Called customer at 2 PM, replacement sent or issue explained..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 outline-none font-semibold text-slate-800 resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveTicketModal}
                disabled={isUpdating}
                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white font-bold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {isUpdating ? "Saving Changes..." : "Save Status & Notes"}
              </button>
              <button
                onClick={() => setActiveTicket(null)}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}