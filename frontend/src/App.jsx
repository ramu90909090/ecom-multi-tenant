import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SettingsProvider } from "./context/SettingsContext";
import { CartProvider } from "./context/CartContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Layout & Guards
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
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

// User Pages
import AboutUs from "./pages/user/AboutUs";
import ContactUs from "./pages/user/ContactUs";
import UserDashboard from "./pages/user/UserDashboard";

// Admin CMS & CRM Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageProducts from "./pages/admin/ManageProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import HeaderFooterCms from "./pages/admin/HeaderFooterCms";
import AboutPageCms from "./pages/admin/AboutPageCms";
import ContactPageCms from "./pages/admin/ContactPageCms";
import ContactInquiries from "./pages/admin/ContactInquiries";

// WhatsApp Automation Pages
import AdminWhatsAppQR from "./pages/admin/AdminWhatsAppQR"; // Live QR Scanner Page
import AdminWhatsApp from "./pages/admin/AdminWhatsApp";     // Logs & Queue Page

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <Router>
              <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    {/* Public Storefront Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<ContactUs />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* User Dashboard */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <UserDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Admin Protected Routes with Left Sidebar Menu */}
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute allowedRoles={["admin"]}>
                          <AdminLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<AdminDashboard />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<ManageProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="users" element={<AdminUsers />} />

                      {/* 1. WhatsApp Live QR Scanner */}
                      <Route path="whatsapp-qr" element={<AdminWhatsAppQR />} />

                      {/* 2. WhatsApp Outgoing Notification Logs & Queue */}
                      <Route path="whatsapp" element={<AdminWhatsApp />} />

                      <Route path="contact-inquiries" element={<ContactInquiries />} />
                      <Route path="header-footer-cms" element={<HeaderFooterCms />} />
                      <Route path="about-cms" element={<AboutPageCms />} />
                      <Route path="contact-cms" element={<ContactPageCms />} />
                    </Route>

                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}