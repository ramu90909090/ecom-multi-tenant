import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

// Helper: Current Subdomain ya Tenant Slug nikaalna
export const getTenantSlug = () => {
  const hostname = window.location.hostname; // e.g. "tiwariji.localhost" ya "sharmaji.localhost"

  // 1. Check Subdomain (e.g. tiwariji.localhost ya tiwariji.yourdomain.com)
  const parts = hostname.split(".");
  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0].toLowerCase();
  }

  // 2. Fallback to LocalStorage (agar testing me set kiya ho)
  const storedSlug = localStorage.getItem("current_store_slug");
  if (storedSlug && storedSlug !== "undefined" && storedSlug !== "null") {
    return storedSlug.toLowerCase();
  }

  // 3. Fallback to Path (e.g. localhost:5173/tiwariji/...)
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const reservedPaths = ["login", "register", "admin", "cart", "products", "about", "contact", "dashboard"];
  if (pathParts[0] && !reservedPaths.includes(pathParts[0])) {
    return pathParts[0].toLowerCase();
  }

  return "default";
};

// Request Interceptor: Inject Tenant Headers in every call
API.interceptors.request.use(
  (config) => {
    const slug = getTenantSlug();
    const hostname = window.location.hostname;

    // Backend ko slug aur domain dono pass karein
    config.headers["x-tenant-slug"] = slug;
    config.headers["x-store-slug"] = slug;
    config.headers["x-tenant-domain"] = hostname;

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;