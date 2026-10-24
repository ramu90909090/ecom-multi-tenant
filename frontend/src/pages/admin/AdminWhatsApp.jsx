import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  QrCode,
  RefreshCw,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Send,
  Sparkles
} from "lucide-react";

export default function AdminWhatsApp() {
  const [sessionInfo, setSessionInfo] = useState({
    status: "DISCONNECTED",
    qrCode: "",
    connectedNumber: ""
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Pagination for Logs
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ sentCount: 0, pendingCount: 0, failedCount: 0 });

  // 1. Fetch Session Status
  const fetchStatus = async () => {
    try {
      const res = await API.get("/whatsapp/status");
      if (res.data?.success) {
        setSessionInfo({
          status: res.data.status,
          qrCode: res.data.qrCode,
          connectedNumber: res.data.connectedNumber
        });
      }
    } catch (err) {
      console.error("Status fetch error:", err);
    }
  };

  // 2. Fetch Logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (statusFilter !== "All") params.append("status", statusFilter);
      params.append("page", currentPage);
      params.append("limit", limit);

      const res = await API.get(`/whatsapp/logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Logs fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Polling for live QR code & status updates every 3 seconds if not READY
  useEffect(() => {
    fetchStatus();
    fetchLogs();

    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPage, limit, statusFilter]);

  // Actions
  const handleReconnect = async () => {
    setActionLoading(true);
    try {
      await API.post("/whatsapp/reconnect");
      alert("🔄 Purane session se reconnect kiya ja raha hai...");
      fetchStatus();
    } catch (err) {
      alert(`❌ Reconnect error: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartNewSession = async () => {
    if (
      window.confirm(
        "Kya aap sach me purana session aur saare puraane logs delete karke naya QR generate karna chahte hain?"
      )
    ) {
      setActionLoading(true);
      try {
        await API.post("/whatsapp/new-session");
        alert("🗑️ Purana session delete ho gaya. Naya QR ban raha hai...");
        fetchStatus();
        fetchLogs();
      } catch (err) {
        alert(`❌ Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Kya aap active WhatsApp session ko disconnect karna chahte hain?")) {
      setActionLoading(true);
      try {
        await API.post("/whatsapp/logout");
        alert("🔌 WhatsApp session successfully disconnect ho gaya.");
        fetchStatus();
      } catch (err) {
        alert(`❌ Error: ${err.response?.data?.message || err.message}`);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleRetryMessage = async (id) => {
    try {
      await API.post(`/whatsapp/retry/${id}`);
      alert("✅ Message dobara queue me bhej diya gaya!");
      fetchLogs();
    } catch (err) {
      alert(`❌ Retry failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleCleanAllLogs = async () => {
    if (window.confirm("Kya aap saare message logs ko delete karna chahte hain?")) {
      try {
        await API.post("/whatsapp/bulk-delete", { deleteAll: true });
        alert("Saare logs clean kar diye gaye!");
        fetchLogs();
      } catch (err) {
        alert(`❌ Delete failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  const isConnected = sessionInfo.status === "READY";
  const isQrReady = sessionInfo.status === "QR_READY" && !!sessionInfo.qrCode;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            WhatsApp Automation & QR Hub
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Automated WhatsApp order notifications, session recovery & live QR scanning
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-xs ${
              isConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : isQrReady
                ? "bg-amber-50 text-amber-700 border-amber-300 animate-pulse"
                : sessionInfo.status === "RECONNECTING"
                ? "bg-blue-50 text-blue-700 border-blue-300"
                : "bg-rose-50 text-rose-700 border-rose-300"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-500"
                  : isQrReady
                  ? "bg-amber-500"
                  : sessionInfo.status === "RECONNECTING"
                  ? "bg-blue-500"
                  : "bg-rose-500"
              }`}
            />
            <span>Status: {sessionInfo.status}</span>
          </span>
        </div>
      </div>

      {/* 2. QR Scanning & Connection Controls Card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* Left: QR Box / Connected Banner (5 cols) */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-200/80 text-center">
          {isConnected ? (
            <div className="space-y-3 py-4 animate-in zoom-in-95">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-base font-black text-slate-900">WhatsApp is Active & Connected!</h3>
              <p className="text-xs text-slate-500 font-medium">
                Admin Phone: <b className="text-emerald-700 font-mono text-sm font-black">+{sessionInfo.connectedNumber || "Registered Phone"}</b>
              </p>
              <p className="text-[11px] text-slate-400">
                Automatic order status aur customer notification queue online kaam kar rahi hai.
              </p>
            </div>
          ) : isQrReady ? (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-2xl border-2 border-indigo-500 shadow-md inline-block">
                <img
                  src={sessionInfo.qrCode}
                  alt="WhatsApp QR Code"
                  className="w-48 h-48 object-contain rounded-xl"
                />
              </div>
              <div>
                <span className="text-xs font-black text-indigo-700 uppercase tracking-wider block">
                  Scan QR with your WhatsApp
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  WhatsApp &gt; Linked Devices &gt; Link a Device
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-6 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto animate-spin">
                <RefreshCw className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-xs font-bold text-slate-600">
                {sessionInfo.status === "RECONNECTING"
                  ? "Attempting session reconnection..."
                  : "Session is offline. Click button to connect."}
              </p>
            </div>
          )}
        </div>

        {/* Right: Manual Session Action Controls (7 cols) */}
        <div className="md:col-span-7 space-y-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Session & Connection Control
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Purane session se reconnect karein, fresh session ke sath naya QR banayein, ya disconnect karein.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            
            {/* Button 1: Reconnect */}
            <button
              onClick={handleReconnect}
              disabled={actionLoading}
              className="p-4 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5 text-indigo-600" />
              <span className="text-xs font-black">Reconnect Session</span>
              <span className="text-[10px] text-slate-500 font-medium">Bina QR ke auto-restore</span>
            </button>

            {/* Button 2: New Session */}
            <button
              onClick={handleStartNewSession}
              disabled={actionLoading}
              className="p-4 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <QrCode className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-black">Start New Session</span>
              <span className="text-[10px] text-slate-500 font-medium">Clear auth & new QR</span>
            </button>

            {/* Button 3: Disconnect */}
            <button
              onClick={handleLogout}
              disabled={actionLoading || !isConnected}
              className="p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Power className="w-5 h-5 text-rose-600" />
              <span className="text-xs font-black">Disconnect Session</span>
              <span className="text-[10px] text-slate-500 font-medium">Logout current device</span>
            </button>

          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">💡 Important Session Note:</p>
            <p>1. LocalAuth session browser band hone par bhi saved rehta hai.</p>
            <p>2. "Start New Session" par click karne se purane saare pending logs clear ho jayenge taaki naye number par unwanted puraane alerts na jayein.</p>
          </div>
        </div>

      </div>

      {/* 3. Notification Dispatch Logs CRM */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Outgoing Notification Message Logs</h3>
            <p className="text-xs text-slate-400 font-bold">
              Total {pagination.total} messages processed • {stats.sentCount} sent • {stats.pendingCount} in queue • {stats.failedCount} failed
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCleanAllLogs}
              className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Logs</span>
            </button>
            <button
              onClick={fetchLogs}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Order ID, Phone number, or Message text..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Delivery Statuses</option>
              <option value="Sent">Sent (Delivered)</option>
              <option value="Pending">Pending in Queue</option>
              <option value="Failed">Failed (Will Retry)</option>
              <option value="Not Reachable">Not Reachable / Invalid</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-center justify-end space-x-2">
            <span className="text-[11px] font-bold text-slate-500">Show:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="py-2 px-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-black rounded-xl text-xs outline-none cursor-pointer"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-500">
              <tr>
                <th className="p-3">Order / Ticket ID</th>
                <th className="p-3">Recipient Phone</th>
                <th className="p-3">Type</th>
                <th className="p-3">Message Snippet</th>
                <th className="p-3">Delivery Status</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    Loading WhatsApp dispatch logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 font-bold">
                    No message logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      {log.orderId || "N/A"}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {log.recipientNumber}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase">
                        {log.triggerType || "alert"}
                      </span>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="truncate text-slate-600 text-[11px]">{log.messageBody}</p>
                      {log.errorReason && (
                        <p className="text-[10px] text-rose-600 font-bold truncate">
                          Reason: {log.errorReason}
                        </p>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.status === "Sent"
                            ? "bg-emerald-50 text-emerald-700"
                            : log.status === "Pending"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "short"
                      })}
                    </td>
                    <td className="p-3 text-right">
                      {log.status === "Failed" && (
                        <button
                          onClick={() => handleRetryMessage(log._id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] transition cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>
            Showing <b>{logs.length}</b> of <b>{pagination.total}</b> logs
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold">{currentPage} / {pagination.totalPages}</span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage >= pagination.totalPages}
              className="p-1.5 border rounded-lg hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}