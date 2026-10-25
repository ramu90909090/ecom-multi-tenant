import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";
import { getImageUrl } from "../utils/productUtils";

const SettingsContext = createContext();

export const defaultSettings = {
  navbar: {
    brandName: "KHASTORE",
    brandSubtitle: "Premium Deals",
    logoUrl: "",
    showSparkleIcon: true
  },
  paymentGateway: {
    upiId: "juhip2019@okaxis",
    merchantName: "Juhi Pafhj",
    codMinAmount: 5000,
    verificationNote:
      "Payment karte waqt verify karein ki receiver UPI ID aur name account se match ho raha ho."
  },
  footer: {
    brandName: "KHASTORE",
    brandSubtitle: "Premium Deals 2026",
    description:
      "Direct factory pricing aur authentic lifestyle & electronic gadgets express pan-India delivery ke sath.",
    trustGuarantees: [
      { title: "Pan-India Shipping", subtitle: "2-4 Business Days Express Delivery", iconKey: "truck" },
      { title: "100% Genuine Brands", subtitle: "Certified Factory Sealed Units", iconKey: "shield" },
      { title: "7 Days Easy Returns", subtitle: "Doorstep Pickup & Instant UPI Refund", iconKey: "rotate" },
      { title: "24/7 Priority Support", subtitle: "Live WhatsApp & Ticket Desk", iconKey: "headphones" }
    ],
    customerDesk: {
      address: "Hazratganj, Lucknow, UP - 226001",
      phone: "+91 81879 21060",
      email: "support@khastore.com"
    },
    socialLinks: {
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
      youtube: "https://youtube.com"
    },
    quickLinks: [
      { label: "Home", url: "/" },
      { label: "All Products", url: "/products" },
      { label: "About Us", url: "/about" },
      { label: "Contact Us", url: "/contact" }
    ],
    copyrightText: "© 2026 KHASTORE. All rights reserved.",
    heartNotice: "Crafted with passion for authentic products."
  }
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTenantAndSettings = async () => {
    try {
      // Tenant aur uski SiteSettings ek sath fetch karein
      const [tenantRes, settingsRes] = await Promise.allSettled([
        API.get("/tenant/current"),
        API.get("/settings")
      ]);

      if (tenantRes.status === "fulfilled" && tenantRes.value.data?.tenant) {
        setTenant(tenantRes.value.data.tenant);
        localStorage.setItem("current_tenant_slug", tenantRes.value.data.tenant.slug);
      }

      if (settingsRes.status === "fulfilled" && settingsRes.value.data?.data) {
        setSettings(settingsRes.value.data.data);
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

  // =========================================================================
  // DYNAMIC BROWSER TITLE & FAVICON SYNCHRONIZATION (Multi-tenant)
  // =========================================================================
  useEffect(() => {
    // 1. Dynamic Title (Navbar Brand Name + Subtitle ya Tenant StoreName)
    const storeTitle =
      settings?.navbar?.brandName?.trim() ||
      tenant?.storeName?.trim() ||
      "KHASTORE";

    const storeSubtitle = settings?.navbar?.brandSubtitle?.trim();
    document.title = storeSubtitle ? `${storeTitle} - ${storeSubtitle}` : storeTitle;

    // 2. Dynamic Favicon (Navbar Logo)
    const logoSource = settings?.navbar?.logoUrl;
    let faviconElement = document.querySelector("link[rel*='icon']");

    if (!faviconElement) {
      faviconElement = document.createElement("link");
      faviconElement.rel = "icon";
      document.head.appendChild(faviconElement);
    }

    if (logoSource) {
      // Agar admin ne custom image URL ya file upload ki hai
      const resolvedLogo = getImageUrl(logoSource);
      faviconElement.href = resolvedLogo;
      faviconElement.type = logoSource.endsWith(".svg") ? "image/svg+xml" : "image/x-icon";
    } else {
      // Fallback: Agar koi logo upload na ho to store ke first letter se dynamic SVG favicon banega
      const initialLetter = storeTitle.charAt(0).toUpperCase() || "S";
      const dynamicSvgFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='25' fill='%237c3aed'/><text x='50%' y='55%' font-size='55' font-weight='900' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='sans-serif'>${initialLetter}</text></svg>`;
      
      faviconElement.href = dynamicSvgFavicon;
      faviconElement.type = "image/svg+xml";
    }
  }, [settings, tenant]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        tenant,
        fetchSettings: fetchTenantAndSettings,
        loading
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);