import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";

// Error Handlers
import ErrorBoundary from "./components/ErrorBoundary";
import NotFound from "./pages/NotFound";

// Layout & Navigation Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";

// Public Pages
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Payment from "./pages/Payment";
import AboutUs from "./pages/user/AboutUs";
import ContactUs from "./pages/user/ContactUs";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// User Protected Dashboard
import UserDashboard from "./pages/user/UserDashboard";

// Admin CMS, CRM & Management Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageProducts from "./pages/admin/ManageProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCoupons from "./pages/admin/AdminCoupons";
import AdminWhatsAppQR from "./pages/admin/AdminWhatsAppQR";
import AdminWhatsappLogs from "./pages/admin/AdminWhatsappLogs";
import ContactInquiries from "./pages/admin/ContactInquiries";
import HeaderFooterCms from "./pages/admin/HeaderFooterCms";
import AboutPageCms from "./pages/admin/AboutPageCms";
import ContactPageCms from "./pages/admin/ContactPageCms";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SettingsProvider>
          <CartProvider>
            <Router>
              <Routes>
                {/* ========================================================= */}
                {/* 1. ADMIN STUDIO CONTROL HUB (Protected for Admin/Manager) */}
                {/* ========================================================= */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={["admin", "manager"]}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="products" element={<ManageProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                  <Route path="whatsapp-qr" element={<AdminWhatsAppQR />} />
                  <Route path="whatsapp" element={<AdminWhatsappLogs />} />
                  <Route path="contact-inquiries" element={<ContactInquiries />} />
                  <Route path="header-footer-cms" element={<HeaderFooterCms />} />
                  <Route path="about-cms" element={<AboutPageCms />} />
                  <Route path="contact-cms" element={<ContactPageCms />} />
                  <Route path="*" element={<NotFound />} />
                </Route>

                {/* ========================================================= */}
                {/* 2. USER PROTECTED DASHBOARD                               */}
                {/* ========================================================= */}
                <Route
                  path="/user/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["user", "admin"]}>
                      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
                        <Navbar />
                        <main className="flex-1">
                          <UserDashboard />
                        </main>
                        <Footer />
                      </div>
                    </ProtectedRoute>
                  }
                />

                {/* ========================================================= */}
                {/* 3. PUBLIC STOREFRONT (Shared Layout with Navbar & Footer) */}
                {/* ========================================================= */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
                      <Navbar />
                      <main className="flex-1">
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/products" element={<Products />} />
                          <Route path="/product/:id" element={<ProductDetails />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/payment" element={<Payment />} />
                          <Route path="/about" element={<AboutUs />} />
                          <Route path="/contact" element={<ContactUs />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                      <Footer />
                    </div>
                  }
                />
              </Routes>
            </Router>
          </CartProvider>
        </SettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}