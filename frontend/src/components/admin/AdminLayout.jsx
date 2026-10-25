import React, { useState } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Sliders,
  Info,
  Layers,
  MessageSquare,
  QrCode,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Store,
  ExternalLink
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { getImageUrl } from "../../utils/productUtils";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { settings, tenant } = useSettings();

  // Exactly wahi dynamic Brand Name, Subtitle aur Logo jo Navbar me render ho raha hai
  const brandName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";
  const brandSubtitle = settings?.navbar?.brandSubtitle || "Admin Studio";
  const logoUrl = settings?.navbar?.logoUrl;

  // Sabhi Admin Navigation Modules
  const navItems = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products Catalog", to: "/admin/products", icon: Package },
    { label: "Orders & Delivery", to: "/admin/orders", icon: ShoppingCart },
    { label: "Customer Accounts", to: "/admin/users", icon: Users },
    { label: "WhatsApp QR Scanner", to: "/admin/whatsapp-qr", icon: QrCode },
    { label: "WhatsApp Logs & Queue", to: "/admin/whatsapp", icon: MessageSquareText },
    { label: "Contact CRM Tickets", to: "/admin/contact-inquiries", icon: MessageSquare },
    { label: "Header, Footer & QR", to: "/admin/header-footer-cms", icon: Sliders },
    { label: "About Us CMS", to: "/admin/about-cms", icon: Info },
    { label: "Contact Us CMS", to: "/admin/contact-cms", icon: Layers }
  ];

  const getLinkClasses = ({ isActive }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 ${
      isActive
        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* LEFT SIDEBAR                                                              */}
      {/* ========================================================================= */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between p-4 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="space-y-4 flex flex-col min-h-0">
          {/* Logo & Dynamic Navbar Brand Header */}
          <div className="flex items-center justify-between px-1 pb-3 border-b border-slate-100 shrink-0">
            <Link to="/" className="flex items-center space-x-2.5 min-w-0 group">
              {/* Dynamic Logo Box */}
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

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 cursor-pointer"
              title="Toggle Sidebar"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Navigation Links */}
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

        {/* Sidebar Footer */}
        <div className="border-t border-slate-100 pt-3 space-y-2 shrink-0">
          <Link
            to="/"
            target="_blank"
            className="flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-500 hover:text-pink-600 hover:bg-pink-50 text-xs font-bold transition"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Live Public Store</span>}
          </Link>

          {!collapsed && (
            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black text-slate-900 truncate">{user?.name || "Admin"}</p>
                <p className="text-[9px] font-bold text-violet-600 uppercase">Super Admin</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar (Navbar Brand & Logo yahan bhi live dikhega) */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl border border-slate-200 text-slate-700 cursor-pointer"
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

          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}