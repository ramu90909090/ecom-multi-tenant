import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Compass,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import API from "../api/axios";
import { useSettings } from "../context/SettingsContext";
import OtpModal from "../components/OtpModal";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    pincode: "",
    state: "",
    district: "",
    password: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const { settings, tenant } = useSettings();
  const navigate = useNavigate();

  // Multi-tenant dynamic store name
  const storeName = settings?.navbar?.brandName || tenant?.storeName || "KHASTORE";

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  // Step 1: Submit Details & Trigger Backend OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Password aur Confirm Password match nahi ho rahe!");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (formData.password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/register", formData);
      if (res.data?.success) {
        setShowOtpModal(true);
      } else {
        setError(res.data?.message || "Registration fail ho gayi!");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Registration error:", err);
      const backendMsg = err.response?.data?.message || err.message || "Network error: Backend server connect nahi hua!";
      setError(backendMsg);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP and finalize account creation
  const handleVerifyOtp = async (otp) => {
    try {
      const res = await API.post("/auth/verify-registration-otp", {
        email: formData.email,
        otp,
        userData: formData
      });
      if (res.data?.success) {
        setShowOtpModal(false);
        alert("✅ Account safaltapoorvak ban gaya hai! Ab login karein.");
        navigate("/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Invalid ya expired OTP!");
    }
  };

  // Resend fresh OTP
  const handleResendOtp = async () => {
    try {
      await API.post("/auth/resend-otp", {
        email: formData.email,
        purpose: "registration"
      });
      alert("Naya OTP aapke email par bhej diya gaya hai!");
    } catch (err) {
      alert(err.response?.data?.message || err.message || "OTP resend fail ho gaya!");
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-violet-50 via-pink-50/50 to-amber-50/40">
      {/* Background Decorative Ambient Blobs */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-white/85 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-pink-500/10">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 text-white shadow-lg shadow-pink-500/30">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
            {storeName} Par Naya Account Banayein
          </h2>
          <p className="text-xs text-gray-500">
            Apni details enter karein aur doorstep express delivery & exclusive discounts payein.
          </p>
        </div>

        {/* Prominent Error Alert Banner */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Multi-field Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Row 1: Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="name"
                  placeholder="Rahul Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  name="email"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Mobile Number & Pincode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Mobile Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  name="mobile"
                  placeholder="9876543210"
                  value={formData.mobile}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Area Pincode *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  name="pincode"
                  placeholder="226001"
                  value={formData.pincode}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Address */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Delivery Address Line *
            </label>
            <div className="relative">
              <Compass className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                name="address"
                placeholder="Flat / House No., Landmark, Sector"
                value={formData.address}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
              />
            </div>
          </div>

          {/* Row 4: State Selection & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                State *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <select
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition cursor-pointer"
                >
                  <option value="">State Select Karein</option>
                  {indianStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                District / City *
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  name="district"
                  placeholder="e.g. Lucknow"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Create Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  name="password"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  name="confirmPassword"
                  placeholder="Password dobara likhein"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 rounded-2xl text-xs font-semibold outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-pink-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Free Account</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-600">
            Pehle se account bana hua hai?{" "}
            <Link
              to="/login"
              className="font-bold text-pink-600 hover:text-violet-600 inline-flex items-center space-x-1 ml-1 transition"
            >
              <span>Yahan Login Karein</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>

      {/* 3-Minute Registration OTP Modal */}
      {showOtpModal && (
        <OtpModal
          isOpen={showOtpModal}
          onClose={() => setShowOtpModal(false)}
          email={formData.email}
          purpose="registration"
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
        />
      )}
    </div>
  );
}