import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Safe initial user state
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user_info");
      if (!saved || saved === "undefined" || saved === "null") {
        return null;
      }
      return JSON.parse(saved);
    } catch (err) {
      console.error("Local user parse error:", err);
      localStorage.removeItem("user_info");
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Sync profile only if token exists
  useEffect(() => {
    const fetchLatestProfile = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await API.get("/auth/profile");
        const userData = res.data?.user || res.data?.data;

        if (res.data?.success && userData) {
          setUser(userData);
          localStorage.setItem("user_info", JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem("user_info");
          localStorage.removeItem("auth_token");
        }
      } catch (err) {
        setUser(null);
        localStorage.removeItem("user_info");
        localStorage.removeItem("auth_token");
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProfile();
  }, []);

  // 1. Initial Login Request
  const loginUser = async (email, password) => {
    return await API.post("/auth/login", { email, password });
  };

  // 2. Verify Login OTP & Set Tokens
  const verifyLoginOtp = async (email, otp) => {
    const res = await API.post("/auth/verify-login-otp", { email, otp });
    const userData = res.data?.user || res.data?.data;
    const token = res.data?.token;

    if (res.data?.success && userData) {
      setUser(userData);
      localStorage.setItem("user_info", JSON.stringify(userData));
      if (token) {
        localStorage.setItem("auth_token", token);
      }
      return { success: true, user: userData };
    }
    return { success: false, message: res.data?.message || "OTP verification failed" };
  };

  // 3. Google OAuth Login
  const handleGoogleLogin = async (credential) => {
    const res = await API.post("/auth/google", { credential });
    const userData = res.data?.user || res.data?.data;
    const token = res.data?.token;

    if (res.data?.success && userData) {
      setUser(userData);
      localStorage.setItem("user_info", JSON.stringify(userData));
      if (token) {
        localStorage.setItem("auth_token", token);
      }
      return { success: true, user: userData };
    }
    throw new Error(res.data?.message || "Google login failed");
  };

  // 4. Clean Logout (Wipes everything instantly)
  const logoutUser = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.warn("Logout endpoint error:", err.message);
    } finally {
      // Clear React State
      setUser(null);
      // Clear all local & session storage
      localStorage.removeItem("user_info");
      localStorage.removeItem("auth_token");
      sessionStorage.clear();
      // Hard redirect to login so all cached states refresh cleanly
      window.location.replace("/login");
    }
  };

  // 5. Update Profile
  const updateProfile = async (updatedData) => {
    const res = await API.put("/auth/profile", updatedData);
    const userData = res.data?.user || res.data?.data;

    if (res.data?.success && userData) {
      setUser(userData);
      localStorage.setItem("user_info", JSON.stringify(userData));
    }
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        loginUser,
        loginuser: loginUser,
        verifyLoginOtp,
        handleGoogleLogin,
        logoutUser,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);