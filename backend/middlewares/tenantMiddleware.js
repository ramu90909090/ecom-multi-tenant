const Tenant = require("../models/Tenant");

module.exports = async (req, res, next) => {
  try {
    let tenantSlug = null;
    let customDomain = null;

    // 1. Check Custom Headers from Frontend Axios
    if (req.headers["x-tenant-slug"]) {
      tenantSlug = String(req.headers["x-tenant-slug"]).trim().toLowerCase();
    } else if (req.headers["x-store-slug"]) {
      tenantSlug = String(req.headers["x-store-slug"]).trim().toLowerCase();
    }

    // 2. Check Origin or Referer (e.g. "http://tiwariji.localhost:5173")
    if (!tenantSlug || tenantSlug === "default" || tenantSlug === "localhost") {
      const origin = req.headers["origin"] || req.headers["referer"] || "";
      if (origin) {
        try {
          const originHost = new URL(origin).hostname; // "tiwariji.localhost"
          const parts = originHost.split(".");
          if (parts.length > 1 && parts[0] !== "www" && parts[0] !== "localhost") {
            tenantSlug = parts[0].toLowerCase();
          } else if (originHost !== "localhost" && originHost !== "127.0.0.1") {
            customDomain = originHost.toLowerCase();
          }
        } catch (e) {
          // ignore invalid url
        }
      }
    }

    // 3. Fallback: Host Header (Production direct domain mapping)
    if (!tenantSlug && !customDomain) {
      const host = req.headers["host"] ? req.headers["host"].split(":")[0].toLowerCase() : "";
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        const hostParts = host.split(".");
        if (hostParts.length > 1 && hostParts[0] !== "localhost") {
          tenantSlug = hostParts[0];
        } else {
          customDomain = host;
        }
      }
    }

    // 4. Query Tenant from DB
    let tenant = null;

    // A. Pehle Slug se khojein
    if (tenantSlug && tenantSlug !== "localhost" && tenantSlug !== "default") {
      tenant = await Tenant.findOne({ slug: tenantSlug, isActive: true });
    }

    // B. Agar slug se na mile toh customDomain se khojein
    if (!tenant && customDomain) {
      tenant = await Tenant.findOne({ customDomain, isActive: true });
    }

    // C. Fallback: Agar local testing me koi slug na mila ho toh 'tiwariji' ya pehla active tenant lein
    if (!tenant) {
      tenant = await Tenant.findOne({ slug: "tiwariji" }) || await Tenant.findOne({ isActive: true });
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Koi valid Tenant Store nahi mila. Kripya pehle store onboard karein."
      });
    }

    // Request object me tenant attach karein
    req.tenant = tenant;
    req.currentStore = tenant; // compatibility
    next();
  } catch (error) {
    console.error("Tenant resolution middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Tenant store resolve karne me internal error aaya."
    });
  }
};