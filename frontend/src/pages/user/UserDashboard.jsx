import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  RotateCcw,
  Search,
  Printer,
  X,
  CreditCard,
  User as UserIcon,
  RefreshCw,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import PaymentInvoice from "../../components/payment/PaymentInvoice";
import ProfileModal from "../../components/ProfileModal";

export default function UserDashboard() {
  const { user } = useAuth();
  const { tenant } = useSettings();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters, Search & Pagination States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0
  });

  // Modal Popups
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Fetch Orders with Search, Filter & Pagination
  const fetchMyOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const query = new URLSearchParams();
      if (search.trim()) query.append("search", search.trim());
      if (statusFilter !== "All") query.append("orderStatus", statusFilter);
      query.append("page", currentPage);
      query.append("limit", limit);

      const res = await API.get(`/orders/my-orders?${query.toString()}`);
      if (res.data?.success) {
        setOrders(res.data.data || []);
        if (res.data.pagination) {
          setPagination({
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages
          });
        }
        if (res.data.stats) {
          // Calculate total spent if orders exist
          const totalSpent = (res.data.data || []).reduce(
            (acc, curr) => acc + (curr.pricing?.totalPayable || 0),
            0
          );
          setStats({
            ...res.data.stats,
            totalSpent
          });
        }
      }
    } catch (err) {
      console.error("Order fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial Fetch & Filter Triggers
  useEffect(() => {
    fetchMyOrders();
  }, [statusFilter, currentPage, limit]);

  // Real-time Background Polling every 12 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchMyOrders(true);
    }, 12000);
    return () => clearInterval(pollInterval);
  }, [statusFilter, currentPage, limit, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchMyOrders();
  };

  const getStepProgress = (status) => {
    switch (status) {
      case "Pending":
        return 1;
      case "Processing":
        return 2;
      case "Shipped":
        return 3;
      case "Delivered":
        return 4;
      case "Cancelled":
        return -1;
      default:
        return 1;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* 1. Header Profile & Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-black text-2xl sm:text-3xl uppercase shadow-lg">
              {user?.name ? user.name.charAt(0) : "U"}
            </div>
            <div>
              <div className="inline-flex items-center space-x-1.5 px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Customer Hub • {tenant?.storeName || "KHASTORE"}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
                Welcome, {user?.name || "Shopper"}!
              </h1>
              <p className="text-xs text-pink-100 mt-0.5">
                {user?.email} • {user?.mobile || "No Mobile"} • {user?.district || user?.state || "India"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={() => fetchMyOrders(true)}
              disabled={isRefreshing}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              title="Sync latest live orders"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>{isRefreshing ? "Syncing..." : "Sync Orders"}</span>
            </button>

            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-950 hover:bg-black text-white font-black text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* Decorative Glow */}
        <div className="absolute -right-8 -bottom-8 w-60 h-60 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. Real-Time Order KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">{pagination.total || stats.totalOrders || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Progress</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">{stats.pendingOrders || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Delivered</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">{stats.deliveredOrders || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Purchases</p>
            <h3 className="text-xl sm:text-2xl font-black text-gray-900">
              ₹{(stats.totalSpent || 0).toLocaleString()}
            </h3>
          </div>
        </div>
      </div>

      {/* 3. Search, Filter Toolbar & Page Limits */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search Order ID, product title, UTR..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-20 py-2 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 rounded-xl text-xs font-semibold outline-none transition"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 bottom-1 px-3 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-black transition"
          >
            Find
          </button>
        </form>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-pink-500/20"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Orders History & Live Visual Stepper Cards */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-400">Loading your orders & live statuses...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">No Orders Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Aapne abhi tak koi order place nahi kiya hai ya filter criteria se koi order match nahi hua.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-pink-600 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/20 transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Start Shopping Now</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const step = getStepProgress(order.orderStatus);

            return (
              <div
                key={order._id || order.orderId}
                className="bg-white p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition space-y-6"
              >
                {/* Top Meta Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-gray-900">
                        Order #{order.orderId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.orderStatus === "Delivered"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : order.orderStatus === "Cancelled"
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-amber-50 text-amber-600 border border-amber-200"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
                      Placed on:{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium"
                      })}{" "}
                      at{" "}
                      {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                        timeStyle: "short"
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        order.paymentInfo?.status === "Verified"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        Payment: {order.paymentInfo?.status || "Pending Verification"}
                      </span>
                    </span>

                    <button
                      onClick={() => setSelectedInvoiceOrder(order)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-pink-400" />
                      <span>View & Print Slip</span>
                    </button>
                  </div>
                </div>

                {/* 4-Step Interactive Live Stepper Tracker */}
                {order.orderStatus !== "Cancelled" ? (
                  <div className="py-2">
                    <div className="flex justify-between items-center relative max-w-lg mx-auto">
                      {/* Grey Base Line */}
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-0 -translate-y-1/2 rounded-full" />
                      
                      {/* Active Color Line */}
                      <div
                        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 -z-0 -translate-y-1/2 rounded-full transition-all duration-700"
                        style={{
                          width: `${((Math.max(1, step) - 1) / 3) * 100}%`
                        }}
                      />

                      {[
                        { label: "Order Placed", s: 1, icon: Package },
                        { label: "Processing", s: 2, icon: Clock },
                        { label: "Dispatched", s: 3, icon: Truck },
                        { label: "Delivered", s: 4, icon: CheckCircle2 }
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center bg-white px-2 z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                              step >= item.s
                                ? "bg-gradient-to-tr from-violet-600 to-pink-600 text-white scale-110 shadow-pink-500/30"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {step > item.s ? (
                              "✓"
                            ) : (
                              <item.icon className="w-4 h-4" />
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-bold mt-1.5 ${
                              step >= item.s ? "text-gray-900" : "text-gray-400"
                            }`}
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-bold flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>This order has been cancelled. If payment was deducted, refund will be processed in 24 hours.</span>
                  </div>
                )}

                {/* Items in this Order */}
                <div className="space-y-3 pt-2">
                  {(order.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50/70 p-3 rounded-2xl border border-gray-100 text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={it.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80"}
                          alt={it.name}
                          className="w-12 h-12 object-cover rounded-xl border border-gray-200 shrink-0"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&q=80";
                          }}
                        />
                        <div>
                          <p className="font-extrabold text-gray-900 line-clamp-1">{it.name}</p>
                          <p className="text-[11px] text-gray-400 font-semibold">
                            Qty: <b className="text-gray-700">{it.quantity}</b> • Price: ₹{Number(it.price || it.finalPrice).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-gray-900 text-sm">
                        ₹{Number(it.total || (it.finalPrice || it.price) * it.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-gray-500 gap-3">
                  <div>
                    <span className="font-bold text-gray-700">Delivery Destination: </span>
                    <span>
                      {order.shippingDetails?.address}, {order.shippingDetails?.city} ({order.shippingDetails?.pincode})
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-gray-500 font-bold">Total Paid:</span>
                    <span className="text-lg font-black bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                      ₹{Number(order.pricing?.totalPayable || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 5. Pagination Bar */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs font-bold text-gray-600">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 text-xs outline-none cursor-pointer"
              >
                <option value={5}>5 orders</option>
                <option value={10}>10 orders</option>
                <option value={20}>20 orders</option>
              </select>
              <span>per page (Total {pagination.total} orders)</span>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-black text-gray-800">
                Page {currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View & Print Invoice Slip Modal (Centered with Proper Screen Height) */}
      {selectedInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-2xl w-full my-auto max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl bg-white animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedInvoiceOrder(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 hover:text-gray-900 transition cursor-pointer"
              title="Close Slip"
            >
              <X className="w-5 h-5" />
            </button>
            <PaymentInvoice
              order={selectedInvoiceOrder}
              storeName={tenant?.storeName || user?.name ? `${user?.name}'s Order` : "Store"}
            />
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
}