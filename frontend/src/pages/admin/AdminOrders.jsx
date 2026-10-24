import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  Layers
} from "lucide-react";
import PaymentInvoice from "../../components/payment/PaymentInvoice";
import { getImageUrl } from "../../utils/productUtils";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [paymentMode, setPaymentMode] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt-desc");

  // Multi-Selection State for Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

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
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0
  });

  // Modal Popups
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [copiedUtr, setCopiedUtr] = useState("");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (orderStatus !== "All") params.append("orderStatus", orderStatus);
      if (paymentStatus !== "All") params.append("paymentStatus", paymentStatus);
      if (paymentMode !== "All") params.append("paymentMode", paymentMode);
      params.append("sortBy", sortBy);
      params.append("page", currentPage);
      params.append("limit", limit);

      const res = await API.get(`/orders?${params.toString()}`);
      if (res.data?.success) {
        setOrders(res.data.data || []);
        if (res.data.pagination) setPagination(res.data.pagination);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Fetch orders error:", err);
    } finally {
      setLoading(false);
      setSelectedOrderIds([]); // Clear selection on fresh fetch
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, limit, orderStatus, paymentStatus, paymentMode, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleResetFilters = () => {
    setSearch("");
    setOrderStatus("All");
    setPaymentStatus("All");
    setPaymentMode("All");
    setSortBy("createdAt-desc");
    setCurrentPage(1);
  };

  // Checkbox Selection Logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = orders.map((o) => o._id);
      setSelectedOrderIds(allIds);
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Order Delete
  const handleDeleteSingle = async (id, orderId) => {
    if (window.confirm(`Kya aap sach me Order #${orderId} ko delete karna chahte hain?`)) {
      try {
        const res = await API.delete(`/orders/${id}`);
        alert(res.data?.message || "Order delete ho gaya!");
        fetchOrders();
      } catch (err) {
        alert(`❌ Delete failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Bulk Delete Selected Orders
  const handleBulkDeleteSelected = async () => {
    if (selectedOrderIds.length === 0) return;

    if (
      window.confirm(
        `Kya aap chune gaye ${selectedOrderIds.length} orders ko permanent delete karna chahte hain?`
      )
    ) {
      try {
        const res = await API.delete("/orders/bulk-delete", {
          data: { orderIds: selectedOrderIds }
        });
        alert(res.data?.message || "Orders delete ho gaye!");
        fetchOrders();
      } catch (err) {
        alert(`❌ Bulk Delete failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Direct 1-Click: Delete All Rejected Orders
  const handleDeleteAllRejected = async () => {
    if (
      window.confirm(
        "Kya aap database se saare 'Rejected' payment wale orders ko ek sath delete karna chahte hain?"
      )
    ) {
      try {
        const res = await API.delete("/orders/bulk-delete", {
          data: { deleteAllRejected: true }
        });
        alert(res.data?.message || "Saare Rejected orders delete ho gaye!");
        fetchOrders();
      } catch (err) {
        alert(`❌ Action failed: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Update Status
  const handleUpdateStatus = async (id, newOrderStatus, newPaymentStatus) => {
    try {
      await API.put(`/orders/${id}`, {
        orderStatus: newOrderStatus,
        paymentStatus: newPaymentStatus
      });
      fetchOrders();
      if (selectedOrder && selectedOrder._id === id) {
        setSelectedOrder((prev) => ({
          ...prev,
          orderStatus: newOrderStatus,
          paymentInfo: { ...prev.paymentInfo, status: newPaymentStatus }
        }));
      }
    } catch (err) {
      alert(`❌ Update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    setTimeout(() => setCopiedUtr(""), 2000);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      
      {/* 1. Header & Live Analytics */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Orders & Delivery CRM
          </h1>
          <p className="text-xs text-slate-400 font-bold mt-0.5">
            Search by Order ID, 12-digit Bank UTR, verify payments & bulk delete rejected orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Action: Delete All Rejected Orders */}
          <button
            onClick={handleDeleteAllRejected}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer border border-rose-200"
            title="Database se saare rejected orders ek click me delete karein"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Clean All Rejected Orders</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Pending / Active</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.pendingOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Delivered</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">{stats.deliveredOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3.5">
          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Verified Revenue</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{(stats.totalRevenue || 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Search Toolbar, Multi-Filters & Limits Selector */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box: Order ID, UTR No, Customer (4 cols) */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Order ID, 12-digit UTR, Phone..."
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

          {/* Delivery Status Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={orderStatus}
              onChange={(e) => {
                setOrderStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Delivery Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Status Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Payment Status</option>
              <option value="Verified">Verified</option>
              <option value="Processing">Processing</option>
              <option value="Rejected">Rejected</option>
              <option value="Not Verified">Not Verified</option>
            </select>
          </div>

          {/* Payment Mode Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={paymentMode}
              onChange={(e) => {
                setPaymentMode(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-600 rounded-xl text-xs font-semibold outline-none cursor-pointer"
            >
              <option value="All">All Modes (UPI & COD)</option>
              <option value="upi">UPI QR Only</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </div>

          {/* Limit Options: 10, 25, 50, 100 (2 cols) */}
          <div className="md:col-span-2 flex items-center justify-end space-x-2">
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

        {/* Bulk Action & Active Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Left: Bulk Selection Actions */}
          <div className="flex items-center gap-2">
            {selectedOrderIds.length > 0 ? (
              <div className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-xl border border-pink-200">
                <span className="font-bold">{selectedOrderIds.length} orders selected</span>
                <button
                  type="button"
                  onClick={handleBulkDeleteSelected}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            ) : (
              <span className="text-slate-400 font-semibold text-[11px]">
                Checkbox select karke multiple orders ek sath delete karein.
              </span>
            )}
          </div>

          {/* Right: Reset Filters */}
          {(search || orderStatus !== "All" || paymentStatus !== "All" || paymentMode !== "All") && (
            <button
              onClick={handleResetFilters}
              className="text-pink-600 hover:text-pink-700 font-bold cursor-pointer ml-auto"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Orders Table with Checkbox Support */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-700 uppercase">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                </th>
                <th className="p-4">Order ID & Date</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Items</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Bank UTR / Ref</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Delivery Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-slate-400 font-bold">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching store orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-12 text-center text-slate-400 font-bold">
                    Koi order match nahi hua. Search clear karke dobara dekhein.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord._id);
                  const isRejected = ord.paymentInfo?.status === "Rejected";

                  return (
                    <tr
                      key={ord._id}
                      className={`transition ${
                        isSelected
                          ? "bg-indigo-50/40"
                          : isRejected
                          ? "bg-rose-50/20 hover:bg-rose-50/40"
                          : "hover:bg-slate-50/60"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(ord._id)}
                          className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                        />
                      </td>

                      {/* Order ID */}
                      <td className="p-4">
                        <span className="font-mono font-black text-slate-900 block">
                          #{ord.orderId}
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            dateStyle: "medium"
                          })}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <p className="font-bold text-slate-900">{ord.shippingDetails?.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {ord.shippingDetails?.phone} • {ord.shippingDetails?.city}
                        </p>
                      </td>

                      {/* Items */}
                      <td className="p-4">
                        <span className="font-bold text-slate-800">
                          {ord.items?.length || 0} product(s)
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                          {ord.items?.[0]?.name}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-black text-slate-900">
                        ₹{ord.pricing?.totalPayable?.toLocaleString()}
                      </td>

                      {/* UTR */}
                      <td className="p-4">
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 w-fit">
                          <span>{ord.paymentInfo?.utrNumber || "N/A"}</span>
                          {ord.paymentInfo?.utrNumber && ord.paymentInfo.utrNumber !== "N/A" && (
                            <button
                              onClick={() => copyToClipboard(ord.paymentInfo.utrNumber)}
                              className="text-slate-400 hover:text-indigo-600 transition"
                              title="Copy UTR"
                            >
                              {copiedUtr === ord.paymentInfo.utrNumber ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Payment Status Dropdown */}
                      <td className="p-4">
                        <select
                          value={ord.paymentInfo?.status || "Processing"}
                          onChange={(e) =>
                            handleUpdateStatus(ord._id, ord.orderStatus, e.target.value)
                          }
                          className={`text-[11px] font-black rounded-xl px-2.5 py-1 outline-none border cursor-pointer ${
                            ord.paymentInfo?.status === "Verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.paymentInfo?.status === "Rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Verified">Verified</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Not Verified">Not Verified</option>
                        </select>
                      </td>

                      {/* Delivery Status Dropdown */}
                      <td className="p-4">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) =>
                            handleUpdateStatus(ord._id, e.target.value, ord.paymentInfo?.status)
                          }
                          className={`text-[11px] font-black rounded-xl px-2.5 py-1 outline-none border cursor-pointer ${
                            ord.orderStatus === "Delivered"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.orderStatus === "Cancelled"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 rounded-lg transition cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInvoiceOrder(ord)}
                          className="p-1.5 bg-slate-100 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-lg transition cursor-pointer"
                          title="Print Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {/* Single Delete Action */}
                        <button
                          onClick={() => handleDeleteSingle(ord._id, ord.orderId)}
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete Order"
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
            Showing <b className="text-slate-800">{orders.length}</b> of{" "}
            <b className="text-slate-800">{pagination.total}</b> orders • Page{" "}
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

      {/* 5. Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Order Details: #{selectedOrder.orderId}
                </h3>
                <p className="text-xs text-slate-400">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Details */}
            <div className="p-4 bg-slate-50 rounded-2xl text-xs space-y-1.5">
              <span className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                Shipping & Delivery Address
              </span>
              <p className="font-bold text-slate-900 text-sm">{selectedOrder.shippingDetails?.name}</p>
              <p className="text-slate-600 font-medium">
                {selectedOrder.shippingDetails?.address}, {selectedOrder.shippingDetails?.city} (
                {selectedOrder.shippingDetails?.pincode}), {selectedOrder.shippingDetails?.state}
              </p>
              <p className="text-slate-500 font-semibold">
                Mobile: <b className="text-slate-800">{selectedOrder.shippingDetails?.phone}</b> • Email:{" "}
                <b className="text-slate-800">{selectedOrder.shippingDetails?.email}</b>
              </p>
            </div>

            {/* Products List */}
            <div className="space-y-2">
              <span className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                Ordered Products ({selectedOrder.items?.length})
              </span>
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl p-2 max-h-52 overflow-y-auto">
                {selectedOrder.items?.map((it, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={getImageUrl(it.image)}
                        alt=""
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                        onError={(e) => {
                          e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&q=80";
                        }}
                      />
                      <div>
                        <p className="font-bold text-slate-900">{it.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">
                          Qty: {it.quantity} • Unit: ₹{Number(it.price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-slate-900">
                      ₹{Number(it.total || it.price * it.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Amount Summary */}
            <div className="flex justify-between items-center p-4 bg-indigo-50/60 rounded-2xl text-xs">
              <div>
                <p className="font-bold text-indigo-950">
                  Mode: <b className="uppercase">{selectedOrder.paymentInfo?.mode}</b>
                </p>
                <p className="text-indigo-700 font-mono text-[11px]">
                  Bank UTR: <b>{selectedOrder.paymentInfo?.utrNumber || "N/A"}</b>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Payable</span>
                <h4 className="text-xl font-black text-indigo-700">
                  ₹{Number(selectedOrder.pricing?.totalPayable || 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setInvoiceOrder(selectedOrder);
                  setSelectedOrder(null);
                }}
                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-4 h-4 text-pink-400" />
                <span>Open Printable Invoice Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Invoice Print Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-2xl w-full my-auto max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl bg-white">
            <button
              onClick={() => setInvoiceOrder(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <PaymentInvoice order={invoiceOrder} storeName="Store Receipt" />
          </div>
        </div>
      )}

    </div>
  );
}