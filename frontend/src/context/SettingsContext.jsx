import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const SettingsContext = createContext();

export const defaultSettings = {
  meta: {
    siteTitle: "Store - Online Deals",
    faviconUrl: ""
  },
  navbar: {
    brandName: "KHASTORE",
    brandSubtitle: "Premium Deals",
    logoUrl: "",
    showSparkleIcon: true
  },
  paymentGateway: {
    upiId: "juhip2019@okaxis",
    merchantName: "Store Merchant",
    qrImageUrl: "",
    verificationNote: "Payment ke waqt receiver UPI verify karein.",
    isCodEnabled: true,
    isUpiEnabled: true
  },
  footer: {
    brandName: "KHASTORE",
    brandSubtitle: "Premium Deals 2026",
    logoUrl: "",
    description: "Direct factory pricing aur authentic deals ka best platform.",
    trustGuarantees: [
      { title: "Free Express Delivery", subtitle: "All India over ₹499", iconKey: "truck", gradient: "from-violet-600 to-indigo-600" },
      { title: "100% Genuine Items", subtitle: "Direct Brand Warranty", iconKey: "shield", gradient: "from-pink-500 to-rose-600" },
      { title: "7-Day Free Returns", subtitle: "No questions asked", iconKey: "rotate", gradient: "from-amber-500 to-orange-600" },
      { title: "Dedicated Support", subtitle: "24/7 Fast assistance", iconKey: "headphones", gradient: "from-emerald-500 to-teal-600" }
    ],
    socialLinks: { instagram: "#", twitter: "#", youtube: "#" },
    quickLinks: [
      { label: "Home Page", url: "/" },
      { label: "All Products", url: "/products" },
      { label: "About Us", url: "/about" },
      { label: "Contact Us", url: "/contact" }
    ],
    customerDesk: {
      address: "Hazratganj, Lucknow, UP",
      phone: "+91 98765 43210",
      email: "support@store.com"
    },
    copyrightText: "© 2026 Store. All rights reserved."
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantAndSettings = async () => {
    try {
      const [tenantRes, settingsRes] = await Promise.all([
        API.get("/tenant/current"),
        API.get("/settings")
      ]);

      if (tenantRes.data?.tenant) {
        setTenant(tenantRes.data.tenant);
        localStorage.setItem("current_tenant_slug", tenantRes.data.tenant.slug);
      }

      if (settingsRes.data?.data) {
        setSettings(settingsRes.data.data);
        // Dynamic Browser Title and Favicon Update
        const meta = settingsRes.data.data.meta;
        if (meta?.siteTitle) {
          document.title = meta.siteTitle;
        } else if (tenantRes.data?.tenant?.storeName) {
          document.title = `${tenantRes.data.tenant.storeName} - Online Store`;
        }
        if (meta?.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement("link");
            link.rel = "icon";
            document.head.appendChild(link);
          }
          link.href = meta.faviconUrl;
        }
      }
    } catch (err) {
      console.log("Using default fallback settings:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantAndSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSettings, tenant, fetchSettings: fetchTenantAndSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);