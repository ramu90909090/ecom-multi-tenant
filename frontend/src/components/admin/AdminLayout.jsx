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
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink,
  Store
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const { tenant } = useSettings();

  // All 9 Admin Navigation Modules
  const navItems = [
    { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products Catalog", to: "/admin/products", icon: Package },
    { label: "Orders & Delivery", to: "/admin/orders", icon: ShoppingCart },
    { label: "Customer Accounts", to: "/admin/users", icon: Users },
    { label: "Header, Footer & QR", to: "/admin/header-footer-cms", icon: Sliders },
    { label: "About Us CMS", to: "/admin/about-cms", icon: Info },
    { label: "Contact Us CMS", to: "/admin/contact-cms", icon: Layers },
    { label: "Contact CRM Tickets", to: "/admin/contact-inquiries", icon: MessageSquare },
    { label: "WhatsApp Logs & Queue", to: "/admin/whatsapp", icon: MessageSquareText }
  ];

  const getLinkClasses = ({ isActive }) =>
    `flex items-center space-x-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
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

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 h-screen z-50 bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between p-4 ${
          collapsed ? "w-20" : "w-64"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="space-y-6">
          {/* Logo & Collapse Header */}
          <div className="flex items-center justify-between px-1">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              {!collapsed && (
                <div>
                  <span className="font-black text-sm tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                    {tenant?.storeName || "KHASTORE"}
                  </span>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase -mt-0.5">
                    Admin Studio
                  </span>
                </div>
              )}
            </Link>

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500"
              title="Toggle Sidebar"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-170px)]">
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

        {/* Footer Tenant Info & Return to Store */}
        <div className="pt-3 border-t border-slate-100">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition"
          >
            <Store className="w-4 h-4 shrink-0" />
            {!collapsed && <span className="truncate">Back to Store</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Navbar */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-sm text-slate-900 truncate">
            {tenant?.storeName || "Store"} Admin Hub
          </span>
          <div className="w-8"></div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}