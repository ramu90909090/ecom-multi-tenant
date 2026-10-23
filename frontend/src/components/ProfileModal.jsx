import React, { useState, useEffect } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Compass,
  Edit2,
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

  const [isEditing, setIsEditing] = useState(false);
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

  // User details ko form state me sync karna
  useEffect(() => {
    if (isOpen) {
      setMessage({ type: "", text: "" });
      setIsEditing(false);

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

      // Backend se fresh profile data load karna
      API.get("/auth/profile")
        .then((res) => {
          const freshData = res.data?.user || res.data?.data;
          if (freshData) {
            setFormData({
              name: freshData.name || "",
              email: freshData.email || "",
              mobile: freshData.mobile || "",
              address: freshData.address || "",
              pincode: freshData.pincode || "",
              state: freshData.state || "",
              district: freshData.district || freshData.city || ""
            });
            if (setUser) setUser(freshData);
          }
        })
        .catch((err) => console.warn("Profile fetch warning:", err.message));
    }
  }, [isOpen, user]);

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
        setIsEditing(false);
        setTimeout(() => {
          setMessage({ type: "", text: "" });
        }, 3000);
      } else {
        setMessage({ type: "error", text: res.data?.message || "Update fail ho gaya." });
      }
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Server connection error! Data save nahi hua."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white flex items-center justify-center shadow-md">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">
                My Profile & Shipping Details
              </h3>
              <p className="text-xs text-gray-400 font-semibold">
                Apna contact information aur delivery address manage karein
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success / Error Message Banner */}
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

        {/* Action Toolbar */}
        <div className="flex justify-between items-center mt-5 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">
            Account Credentials
          </span>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-600 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800 transition cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          
          {/* Row 1: Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="name"
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border ${
                    isEditing
                      ? "bg-white border-pink-400 focus:ring-4 focus:ring-pink-500/10"
                      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Email Address (Read-only)</label>
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  name="mobile"
                  disabled={!isEditing}
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border ${
                    isEditing
                      ? "bg-white border-pink-400 focus:ring-4 focus:ring-pink-500/10"
                      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Area Pincode</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  name="pincode"
                  disabled={!isEditing}
                  value={formData.pincode}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border ${
                    isEditing
                      ? "bg-white border-pink-400 focus:ring-4 focus:ring-pink-500/10"
                      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Delivery Address</label>
            <div className="relative">
              <Compass className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                name="address"
                disabled={!isEditing}
                value={formData.address}
                onChange={handleChange}
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border ${
                  isEditing
                    ? "bg-white border-pink-400 focus:ring-4 focus:ring-pink-500/10"
                    : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                }`}
              />
            </div>
          </div>

          {/* Row 4: State & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">State</label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <select
                  required
                  name="state"
                  disabled={!isEditing}
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border ${
                    isEditing
                      ? "bg-white border-pink-400 focus:ring-4 focus:ring-pink-500/10 cursor-pointer"
                      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                  }`}
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
              <label className="block text-xs font-bold text-gray-700 mb-1">District / City</label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="district"
                  disabled={!isEditing}
                  value={formData.district}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-xs font-semibold outline-none transition border ${
                    isEditing
                      ? "bg-white border-pink-400 focus:ring-4 focus:ring-pink-500/10"
                      : "bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {isEditing && (
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
                    <span>Save Updated Details</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
}