import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

// Helper: Current Subdomain ya Tenant Slug nikaalna
export const getTenantSlug = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
    return parts[0].toLowerCase();
  }
  const storedSlug = localStorage.getItem("current_store_slug");
  if (storedSlug && storedSlug !== "undefined" && storedSlug !== "null") {
    return storedSlug.toLowerCase();
  }
  return "default";
};

// Request Interceptor: Tenant & Authorization Token Headers Inject karein
API.interceptors.request.use(
  (config) => {
    const slug = getTenantSlug();
    const hostname = window.location.hostname;

    config.headers["x-tenant-slug"] = slug;
    config.headers["x-store-slug"] = slug;
    config.headers["x-tenant-domain"] = hostname;

    // LocalStorage se token nikaal kar Bearer header me attach karein
    const token = localStorage.getItem("auth_token");
    if (token && !config.headers["Authorization"]) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default API;