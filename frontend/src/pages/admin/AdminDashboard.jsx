import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import { useSettings } from "../../context/SettingsContext";
import {
  ShoppingCart,
  Users,
  Package,
  DollarSign,
  MessageSquare,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  MessageSquareText,
  Sliders,
  ExternalLink
} from "lucide-react";

export default function AdminDashboard() {
  const { tenant } = useSettings();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalQueries: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardMetrics = async () => {
      try {
        const [ordersRes, usersRes, prodRes, queriesRes] = await Promise.all([
          API.get("/orders?limit=5"),
          API.get("/users?limit=1"),
          API.get("/products?includeOutOfStock=true"),
          API.get("/contact/queries?limit=1")
        ]);

        const orderStats = ordersRes.data?.stats || {};
        setStats({
          totalOrders: orderStats.totalOrders || 0,
          totalRevenue: orderStats.totalRevenue || 0,
          pendingOrders: orderStats.pendingOrders || 0,
          deliveredOrders: orderStats.deliveredOrders || 0,
          totalUsers: usersRes.data?.stats?.totalUsers || 0,
          totalProducts: prodRes.data?.count || 0,
          totalQueries: queriesRes.data?.total || 0
        });

        if (ordersRes.data?.data) {
          setRecentOrders(ordersRes.data.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard metrics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardMetrics();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Store Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-300 mb-2">
            Tenant Control Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {tenant?.storeName || "Store"} Management
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Store Slug: <b className="text-indigo-400">{tenant?.slug || "default"}</b> • Domain:{" "}
            <b className="text-indigo-400">{tenant?.customDomain || window.location.hostname}</b>
          </p>
        </div>
        <Link
          to="/"
          target="_blank"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg transition"
        >
          <span>View Public Storefront</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Total Orders</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalOrders}</h3>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">{stats.pendingOrders} pending</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Verified Revenue</p>
            <h3 className="text-2xl font-black text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Cleared via UPI/Cash</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Store Customers</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalUsers}</h3>
            <p className="text-[10px] text-purple-600 font-bold mt-0.5">Registered Accounts</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">Active Inventory</p>
            <h3 className="text-2xl font-black text-slate-900">{stats.totalProducts}</h3>
            <p className="text-[10px] text-amber-600 font-bold mt-0.5">Catalog products</p>
          </div>
        </div>
      </div>

      {/* Quick Access Modules (Source Section Integrated) */}
      <div>
        <h2 className="text-lg font-black text-slate-900 mb-4">Quick Management Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Module 1: CRM Tickets */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-base text-slate-900">Inquiry & Ticket CRM</h3>
              </div>
              <Link
                to="/admin/contact-inquiries"
                className="text-xs font-bold text-pink-600 hover:text-violet-600 flex items-center space-x-1"
              >
                <span>View All ({stats.totalQueries})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Users dwara bheji gayi saari direct queries ko track karein, customer notes add karein aur unka status Pending, In Progress, ya Resolved mark karein.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/contact-inquiries"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-600 rounded-xl text-xs font-bold transition border border-slate-100"
              >
                <span>Open Tickets CRM</span>
              </Link>
            </div>
          </div>

          {/* Module 2: Page CMS */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-violet-600" />
                <h3 className="font-bold text-base text-slate-900">Contact Us Page CMS</h3>
              </div>
              <Link
                to="/admin/contact-cms"
                className="text-xs font-bold text-violet-600 hover:text-pink-600 flex items-center space-x-1"
              >
                <span>Manage CMS</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Contact Us page ka banner tagline, carousel contact cards, Google Maps location iframe, visiting hours aur dynamic FAQ list ko edit ya customize karein.
            </p>
            <div className="pt-2">
              <Link
                to="/admin/contact-cms"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 hover:bg-violet-50 text-slate-700 hover:text-violet-600 rounded-xl text-xs font-bold transition border border-slate-100"
              >
                <span>Open Page Editor</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Overview */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-900">Recent Store Orders</h2>
          <Link to="/admin/orders" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">
            <span>View All Orders</span> <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400">Loading metrics...</div>
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-slate-400">No recent orders placed yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Items</th>
                  <th className="p-3">Total Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentOrders.map((ord) => (
                  <tr key={ord._id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-900">{ord.orderId}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{ord.shippingDetails?.name}</p>
                      <p className="text-[10px] text-slate-400">{ord.shippingDetails?.phone}</p>
                    </td>
                    <td className="p-3">{ord.items?.length || 0} product(s)</td>
                    <td className="p-3 font-black text-indigo-600">₹{ord.pricing?.totalPayable?.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        ord.orderStatus === "Delivered" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {ord.orderStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}