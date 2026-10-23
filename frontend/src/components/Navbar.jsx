import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Menu,
  X,
  Home,
  Info,
  Phone,
  Package,
  Sparkles,
  User as UserIcon,
  LogIn,
  LogOut,
  ChevronDown,
  ShieldAlert,
  Mail,
  Boxes
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { getImageUrl } from "../utils/productUtils";
import ProfileModal from "./ProfileModal";

export default function Navbar() {
  const { cart } = useCart();
  const { user, logoutUser } = useAuth();
  const { settings, tenant } = useSettings();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dropdownRef = useRef(null);
  const totalItems = cart ? cart.reduce((acc, item) => acc + item.quantity, 0) : 0;

  // Dynamic store name & logo from backend settings / tenant
  const navConfig = settings?.navbar || {};
  const brandName = navConfig.brandName || tenant?.storeName || "KHASTORE";
  const brandSubtitle = navConfig.brandSubtitle || "Premium Deals";

  // Dropdown ke bahar click hone par auto close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Desktop Active Link Styling (Gradients + Glow effect)
  const getDesktopNavLinkClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 flex items-center space-x-1.5 ${
      isActive
        ? "text-white bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-md shadow-pink-500/25 scale-105"
        : "text-slate-700 hover:text-pink-600 hover:bg-white/60"
    }`;

  // Mobile Active Link Styling
  const getMobileNavLinkClass = ({ isActive }) =>
    `flex items-center space-x-3 p-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
      isActive
        ? "text-white bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 shadow-md shadow-pink-500/25 translate-x-1"
        : "text-slate-700 hover:bg-pink-50/70 hover:text-pink-600"
    }`;

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-violet-50/90 via-pink-50/80 to-amber-50/90 backdrop-blur-xl border-b border-white/60 shadow-lg shadow-pink-500/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Dynamic Brand Logo & Store Name */}
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 p-[2px] shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center overflow-hidden">
                  {navConfig.logoUrl ? (
                    <img
                      src={getImageUrl(navConfig.logoUrl)}
                      alt={brandName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-pink-500 group-hover:rotate-12 transition-transform duration-300" />
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 bg-clip-text text-transparent">
                  {brandName}
                </span>
                <span className="text-[9px] font-bold text-gray-500 tracking-widest uppercase -mt-1">
                  {brandSubtitle}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-2 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/80 shadow-inner">
              <NavLink to="/" className={getDesktopNavLinkClass}>
                <Home className="w-4 h-4" />
                <span>Home</span>
              </NavLink>

              <NavLink to="/products" className={getDesktopNavLinkClass}>
                <Package className="w-4 h-4" />
                <span>Products</span>
              </NavLink>

              <NavLink to="/about" className={getDesktopNavLinkClass}>
                <Info className="w-4 h-4" />
                <span>About Us</span>
              </NavLink>

              <NavLink to="/contact" className={getDesktopNavLinkClass}>
                <Phone className="w-4 h-4" />
                <span>Contact Us</span>
              </NavLink>
            </div>

            {/* Right Side: Cart & User Account Menu */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* Cart Button */}
              <NavLink
                to="/cart"
                className={({ isActive }) =>
                  `relative p-2.5 rounded-2xl border transition-all duration-200 ${
                    isActive
                      ? "bg-white text-pink-600 border-pink-300 shadow-md shadow-pink-500/20 scale-105"
                      : "bg-white/80 border-white/60 text-slate-700 hover:text-pink-600 hover:bg-white"
                  }`
                }
                aria-label="View Cart"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] w-5 h-5 flex items-center justify-center rounded-full font-extrabold shadow-md shadow-pink-500/40 animate-pulse">
                    {totalItems}
                  </span>
                )}
              </NavLink>

              {/* Logged In User vs Login Action */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="flex items-center space-x-2 p-1.5 pr-3 rounded-2xl bg-white/90 border border-white/80 shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-500 text-white flex items-center justify-center font-black text-xs uppercase shadow-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-800 max-w-[100px] truncate leading-tight">
                        {user.name?.split(" ")[0]}
                      </span>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-pink-600">
                        {user.role || "User"}
                      </span>
                    </div>

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${
                        profileDropdown ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Profile Dropdown Box */}
                  {profileDropdown && (
                    <div className="absolute right-0 mt-2.5 w-60 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="px-4 py-2 border-b border-gray-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-gray-900 truncate">{user.name}</p>
                          <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                            {user.role || "user"}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate flex items-center space-x-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </p>
                      </div>

                      <div className="p-1.5 space-y-1">
                        {/* Admin Link if role is Admin */}
                        {user.role === "admin" && (
                          <Link
                            to="/admin/dashboard"
                            onClick={() => setProfileDropdown(false)}
                            className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-violet-700 hover:bg-violet-50 rounded-xl flex items-center space-x-2 transition"
                          >
                            <ShieldAlert className="w-4 h-4 text-violet-600" />
                            <span>Admin Dashboard</span>
                          </Link>
                        )}

                        {/* Customer Orders & Tracking */}
                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdown(false)}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                        >
                          <Boxes className="w-4 h-4 text-pink-500" />
                          <span>My Orders & Tracking</span>
                        </Link>

                        {/* Profile Edit Trigger */}
                        <button
                          onClick={() => {
                            setProfileDropdown(false);
                            setIsModalOpen(true);
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-pink-500" />
                          <span>My Profile & Details</span>
                        </button>

                        {/* Logout */}
                        <button
                          onClick={() => {
                            setProfileDropdown(false);
                            if (logoutUser) logoutUser();
                            else navigate("/login");
                          }}
                          className="w-full px-3.5 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center space-x-2 transition cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Logout Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-logged in: Colourful Login Button */
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 hover:opacity-95 shadow-lg shadow-pink-500/30 active:scale-95 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden p-2.5 rounded-2xl bg-white/80 border border-white/60 text-slate-700 hover:text-pink-600 transition cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isOpen ? <X className="w-6 h-6 text-pink-600" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Slide-down Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-white/40 bg-gradient-to-b from-white/95 to-pink-50/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 shadow-2xl animate-in slide-in-from-top duration-300">
            <NavLink to="/" onClick={() => setIsOpen(false)} className={getMobileNavLinkClass}>
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>

            <NavLink to="/products" onClick={() => setIsOpen(false)} className={getMobileNavLinkClass}>
              <Package className="w-4 h-4" />
              <span>Products</span>
            </NavLink>

            <NavLink to="/about" onClick={() => setIsOpen(false)} className={getMobileNavLinkClass}>
              <Info className="w-4 h-4" />
              <span>About Us</span>
            </NavLink>

            <NavLink to="/contact" onClick={() => setIsOpen(false)} className={getMobileNavLinkClass}>
              <Phone className="w-4 h-4" />
              <span>Contact Us</span>
            </NavLink>

            <div className="pt-2 border-t border-gray-100">
              {user ? (
                <div className="space-y-2">
                  <div className="p-3 bg-white/90 rounded-2xl border border-gray-100 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                      <span className="text-[9px] font-extrabold uppercase text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        Role: {user.role || "user"}
                      </span>
                    </div>
                  </div>

                  {user.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-bold text-xs text-violet-700 bg-violet-50 border border-violet-200 shadow-sm active:scale-95 transition"
                    >
                      <ShieldAlert className="w-4 h-4 text-violet-600" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}

                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-bold text-xs text-pink-700 bg-pink-50 border border-pink-200 shadow-sm active:scale-95 transition"
                  >
                    <Boxes className="w-4 h-4 text-pink-600" />
                    <span>My Orders & Tracking</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-bold text-xs text-gray-800 bg-white border border-gray-200 shadow-sm active:scale-95 transition cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-pink-600" />
                    <span>My Profile & Edit</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      if (logoutUser) logoutUser();
                      else navigate("/login");
                    }}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl font-bold text-xs text-white bg-rose-600 shadow-md active:scale-95 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout Session</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500 shadow-lg shadow-pink-500/25 active:scale-95 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login / Register</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Edit Profile Modal */}
      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}