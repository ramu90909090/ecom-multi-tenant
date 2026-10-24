import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Compass,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    pincode: "",
    state: "",
    district: ""
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const indianStates = [
    "Uttar Pradesh",
    "Delhi NCR",
    "Maharashtra",
    "Bihar",
    "Madhya Pradesh",
    "Rajasthan",
    "West Bengal",
    "Karnataka",
    "Gujarat",
    "Punjab",
    "Haryana",
    "Tamil Nadu"
  ];

  // Modal open hote hi data fetch aur state set karna
  useEffect(() => {
    if (isOpen) {
      setMessage({ type: "", text: "" });

      if (user) {
        setFormData({
          name: user.name || "",
          email: user.email || "",
          mobile: user.mobile || "",
          address: user.address || "",
          pincode: user.pincode || "",
          state: user.state || "",
          district: user.district || user.city || ""
        });
      }

      // Backend se latest profile lana
      API.get("/auth/profile")
        .then((res) => {
          const fresh = res.data?.user || res.data?.data;
          if (fresh) {
            setFormData({
              name: fresh.name || "",
              email: fresh.email || "",
              mobile: fresh.mobile || "",
              address: fresh.address || "",
              pincode: fresh.pincode || "",
              state: fresh.state || "",
              district: fresh.district || fresh.city || ""
            });
            if (setUser) setUser(fresh);
          }
        })
        .catch((err) => console.warn("Profile fetch note:", err.message));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: "", text: "" });
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await API.put("/auth/profile", formData);
      const updatedUser = res.data?.user || res.data?.data;

      if (res.data?.success && updatedUser) {
        if (setUser) setUser(updatedUser);
        localStorage.setItem("user_info", JSON.stringify(updatedUser));
        setMessage({ type: "success", text: "Profile details safaltapoorvak update ho gayi!" });
        
        setTimeout(() => {
          setMessage({ type: "", text: "" });
          if (onClose) onClose();
        }, 1200);
      } else {
        setMessage({ type: "error", text: res.data?.message || "Update fail ho gaya." });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update profile."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white flex items-center justify-center shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                Edit My Profile & Details
              </h3>
              <p className="text-xs text-gray-400 font-semibold">
                Apna contact number aur shipping address update karein
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`mt-4 p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-in fade-in ${
              message.type === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form Body - Always Directly Editable */}
        <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-5">
          
          {/* Row 1: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border bg-white border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email (Read Only)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Mobile & Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border bg-white border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Area Pincode *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border bg-white border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address *</label>
            <div className="relative">
              <Compass className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border bg-white border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              />
            </div>
          </div>

          {/* Row 4: State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <select
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border bg-white border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 cursor-pointer"
                >
                  <option value="">Select State</option>
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">District / City *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border bg-white border-gray-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
                />
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 active:scale-95 transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}