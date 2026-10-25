import React, { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tag,
  QrCode,
  MessageSquareText,
  MessageSquare,
  Sliders,
  Info,
  Layers,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  LogOut,
  ShieldAlert
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { getImageUrl } from "../../utils/productUtils";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { settings, tenant } = useSettings();
  const navigate = useNavigate();

  // Dynamic Brand Info from Settings/Tenant
  const brandName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";
  const brandSubtitle = settings?.navbar?.brandSubtitle || "Admin Management";
  const logoUrl = settings?.navbar?.logoUrl;

  // Saare 11 Modules ke Complete Links (Koi bhi feature miss nahi hai)
  const navItems = [
    { label: "Dashboard Overview", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products Catalog", to: "/admin/products", icon: Package },
    { label: "Orders & Delivery", to: "/admin/orders", icon: ShoppingCart },
    { label: "Customer Accounts", to: "/admin/users", icon: Users },
    { label: "Coupons & Discounts", to: "/admin/coupons", icon: Tag },
    { label: "WhatsApp QR Scanner", to: "/admin/whatsapp-qr", icon: QrCode },
    { label: "WhatsApp Logs & Queue", to: "/admin/whatsapp", icon: MessageSquareText },
    { label: "Contact CRM Tickets", to: "/admin/contact-inquiries", icon: MessageSquare },
    { label: "Header, Footer & QR", to: "/admin/header-footer-cms", icon: Sliders },
    { label: "About Us CMS", to: "/admin/about-cms", icon: Info },
    { label: "Contact Us CMS", to: "/admin/contact-cms", icon: Layers }
  ];

  const handleLogout = () => {
    if (window.confirm("Kya aap Admin panel se logout karna chahte hain?")) {
      logout();
      navigate("/login");
    }
  };

  const getLinkClasses = ({ isActive }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 select-none ${
      isActive
        ? "bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 text-white shadow-md shadow-pink-500/20 translate-x-1"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR (Sticky, Scrollable Menu, Collapsible)                       */}
      {/* ========================================================================= */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between p-4 shadow-sm ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="space-y-4 flex flex-col min-h-0 flex-1">
          {/* 1. Header: Store Identity & Collapse Toggle */}
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-100 shrink-0">
            <Link to="/admin/dashboard" className="flex items-center space-x-2.5 min-w-0 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 p-[2px] shadow-md shrink-0">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img
                      src={getImageUrl(logoUrl)}
                      alt={brandName}
                      className="w-full h-full object-contain p-0.5"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-pink-500" />
                  )}
                </div>
              </div>

              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <span className="block font-black text-sm tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent truncate">
                    {brandName}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate -mt-0.5">
                    {brandSubtitle}
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer transition active:scale-95"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Scrollable Navigation (flex-1 overflow-y-auto ensures koi bhi link cut na ho) */}
          <nav className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={getLinkClasses}
                  title={collapsed ? item.label : ""}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* 3. Bottom Profile & System Controls */}
        <div className="border-t border-slate-100 pt-3 space-y-2 shrink-0">
          {/* Public Store Link */}
          <Link
            to="/"
            target="_blank"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 text-xs font-bold transition"
            title="Open Live Public Store"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Live Public Store</span>}
          </Link>

          {/* User Profile Info & Logout */}
          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-black text-slate-900 truncate">{user?.name || "Admin"}</p>
                  <p className="text-[9px] font-bold text-violet-600 uppercase">Super Admin</p>
                </div>
              )}
            </div>

            {/* Logout Trigger */}
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              title="Logout from Admin Panel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Top Navbar Bar */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 cursor-pointer hover:bg-slate-50"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center bg-white p-0.5 shrink-0">
              {logoUrl ? (
                <img
                  src={getImageUrl(logoUrl)}
                  alt={brandName}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <Sparkles className="w-4 h-4 text-pink-500" />
              )}
            </div>
            <span className="font-black text-sm bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent truncate max-w-[160px]">
              {brandName}
            </span>
          </div>

          <Link
            to="/"
            target="_blank"
            className="p-2 text-slate-500 hover:text-pink-600 rounded-xl"
            title="Open Store"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </header>

        {/* Dynamic Nested Routes (Dashboard, Products, Orders, etc.) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}