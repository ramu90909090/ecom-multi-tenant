import React, { useState, useEffect } from "react";
import {
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw
} from "lucide-react";
import API from "../../api/axios";

export default function AdminWhatsappLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    sentCount: 0,
    pendingCount: 0,
    failedCount: 0,
    notReachableCount: 0
  });

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [triggerFilter, setTriggerFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEntries, setTotalEntries] = useState(0);

  // Bulk Multi-Select & Modal
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewingMessage, setViewingMessage] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", itemsPerPage);
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (triggerFilter !== "All") params.append("triggerType", triggerFilter);

      const res = await API.get(`/whatsapp/logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalEntries(res.data.pagination?.total || 0);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Fetch logs error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, itemsPerPage, statusFilter, triggerFilter]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(logs.map((l) => l._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `Kya aap sach me chune huye ${selectedIds.length} logs delete karna chahte hain?`
      )
    ) {
      return;
    }

    try {
      const res = await API.post("/whatsapp/bulk-delete", { ids: selectedIds });
      alert(res.data?.message || "Logs successfully delete ho gaye!");
      setSelectedIds([]);
      fetchLogs();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleRetry = async (id) => {
    try {
      const res = await API.post(`/whatsapp/retry/${id}`);
      alert(res.data?.message || "Message queue me dobara add ho gaya!");
      fetchLogs();
    } catch (err) {
      alert("Retry failed: " + (err.response?.data?.message || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Sent":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "Not Reachable":
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getTriggerLabel = (type) => {
    switch (type) {
      case "order_placed":
        return "Order Placed";
      case "status_updated":
        return "Order Status";
      case "payment_verified":
        return "Payment Verified";
      case "inquiry_created":
        return "Ticket Submitted";
      case "inquiry_status_updated":
        return "Ticket Status";
      default:
        return type || "Alert";
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* 1. Header & Quick Refresh */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-6 h-6 text-emerald-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              WhatsApp Dispatch & Audit Logs
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Real-time audit trail for all order notifications, payment updates & customer support ticket alerts
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Delivered Messages</span>
            <p className="text-lg font-black text-emerald-600">{stats.sentCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Pending Queue</span>
            <p className="text-lg font-black text-amber-600">{stats.pendingCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Failed / Retrying</span>
            <p className="text-lg font-black text-rose-600">{stats.failedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block">Not Reachable / Invalid</span>
            <p className="text-lg font-black text-slate-800">{stats.notReachableCount}</p>
          </div>
        </div>
      </div>

      {/* 3. Filter Toolbar & Multi-Select Action */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Order ID, Ticket, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Sent">Sent (Delivered)</option>
            <option value="Pending">Pending in Queue</option>
            <option value="Failed">Failed (Retrying)</option>
            <option value="Not Reachable">Not Reachable</option>
          </select>

          {/* Trigger Filter (Includes Inquiry Options) */}
          <select
            value={triggerFilter}
            onChange={(e) => {
              setTriggerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="All">All Triggers</option>
            <option value="order_placed">Order Placed</option>
            <option value="status_updated">Order Status Updated</option>
            <option value="payment_verified">Payment Verified</option>
            <option value="inquiry_created">Ticket Created</option>
            <option value="inquiry_status_updated">Ticket Status Updated</option>
          </select>

          {/* Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
        </div>

        {/* Per Page Limit */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <span className="font-bold text-slate-400">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl font-black text-slate-800 outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* 4. Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 uppercase text-slate-500 font-bold text-[11px]">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={logs.length > 0 && selectedIds.length === logs.length}
                    className="accent-indigo-600 rounded cursor-pointer"
                  />
                </th>
                <th className="p-4">Reference & Trigger</th>
                <th className="p-4">Recipient</th>
                <th className="p-4">Status</th>
                <th className="p-4">Attempts / Reason</th>
                <th className="p-4">Logged Time</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400 font-bold">
                    Loading WhatsApp logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-slate-400 font-bold">
                    Koi WhatsApp log nahi mila.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(log._id)}
                        onChange={() => handleSelectOne(log._id)}
                        className="accent-indigo-600 rounded cursor-pointer"
                      />
                    </td>

                    <td className="p-4">
                      <p className="font-mono font-black text-slate-900">
                        {log.orderId || "N/A"}
                      </p>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded inline-block mt-0.5 ${
                          log.triggerType?.startsWith("inquiry")
                            ? "bg-violet-50 text-violet-700"
                            : "bg-indigo-50 text-indigo-700"
                        }`}
                      >
                        {getTriggerLabel(log.triggerType)}
                      </span>
                    </td>

                    <td className="p-4">
                      <p className="font-mono font-bold text-slate-900">
                        {log.recipientNumber}
                      </p>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {log.recipientType}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(
                          log.status
                        )}`}
                      >
                        {log.status}
                      </span>
                    </td>

                    <td className="p-4 max-w-xs">
                      <span className="font-bold text-slate-700 text-xs">
                        {log.retries || 0}/{log.maxRetries || 3} Retries
                      </span>
                      {log.errorReason && (
                        <p className="text-[10px] text-rose-500 truncate mt-0.5 font-medium">
                          {log.errorReason}
                        </p>
                      )}
                    </td>

                    <td className="p-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </td>

                    <td className="p-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setViewingMessage(log)}
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                        title="View Full Message"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>

                      {log.status !== "Sent" && (
                        <button
                          onClick={() => handleRetry(log._id)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition cursor-pointer"
                          title="Retry Message"
                        >
                          <RotateCw className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Pagination Footer */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <div>
            Total Logged Entries: <strong className="text-slate-900">{totalEntries}</strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. Message Viewer Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-hidden">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Message Preview:{" "}
                  <span className="font-mono text-emerald-600">
                    {viewingMessage.recipientNumber}
                  </span>
                </h3>
                <span className="text-[10px] text-slate-400">
                  Ref ID: <b>{viewingMessage.orderId}</b> | Status: <b>{viewingMessage.status}</b>
                </span>
              </div>
              <button
                onClick={() => setViewingMessage(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto text-slate-800">
              {viewingMessage.messageBody}
            </div>

            {viewingMessage.errorReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
                <b>Error Log:</b> {viewingMessage.errorReason}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              {viewingMessage.status !== "Sent" && (
                <button
                  onClick={() => {
                    handleRetry(viewingMessage._id);
                    setViewingMessage(null);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Retry Dispatch
                </button>
              )}
              <button
                onClick={() => setViewingMessage(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}