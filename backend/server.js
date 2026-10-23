const express = require("express");
const dotenv = require("dotenv");
const path = require("path");

// Load Environment Variables (.env)
dotenv.config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const hpp = require("hpp");
const connectDB = require("./config/db");

// Tenant Middleware
const tenantMiddleware = require("./middlewares/tenantMiddleware");

// Routes Imports
const tenantRoutes = require("./routes/tenantRoutes");
const authRoutes = require("./routes/authRoutes");
const contactRoutes = require("./routes/contactRoutes");
const aboutRoutes = require("./routes/aboutRoutes");
const productRoutes = require("./routes/productRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");

// WhatsApp Engine & Message Queue Services
const whatsappService = require("./services/whatsappService");
const { processQueue } = require("./services/queueService");

// Database Initialization
connectDB();

const app = express();

// Trust Proxy for multi-tenant subdomains & reverse proxy (Nginx / Cloudflare)
app.set("trust proxy", 1);

// 1. Security Headers with Cross-Origin Resource Policy for Uploaded Images
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// 2. Dynamic CORS Configuration (Full Subdomains & Multi-Tenant Headers Support)
const allowedHeadersList = [
  "Content-Type",
  "Authorization",
  "x-tenant-slug",
  "x-store-slug",
  "x-tenant-id",
  "x-tenant-domain",
  "X-Requested-With",
  "Accept"
];

const corsOptions = {
  origin: (origin, callback) => {
    // Mobile apps, Postman ya curl calls allow karein (origin undefined hota hai)
    if (!origin) return callback(null, true);

    try {
      const url = new URL(origin);
      const host = url.hostname; // e.g. "tiwariji.localhost", "localhost", "sharmaji.localhost"

      // Localhost aur kisi bhi *.localhost subdomain ko allow karein
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".localhost") ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
      ) {
        return callback(null, true);
      }

      // Production wildcard domain aur custom tenant domains ko allow karein
      return callback(null, true);
    } catch (err) {
      return callback(new Error("CORS validation failed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: allowedHeadersList
};

// Global CORS Middleware handles both normal requests and preflight OPTIONS automatically
app.use(cors(corsOptions));

// 3. Rate Limiting (Brute-Force & DDoS Protection)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 250,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  }
});
app.use("/api", limiter);

// 4. Body & Cookie Parsers
app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(cookieParser());

// 5. Express 5 Safe Mongo Sanitize (No direct req.query reassignment)
app.use((req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  if (req.query) {
    const cleanQuery = mongoSanitize.sanitize({ ...req.query });
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, cleanQuery);
  }
  next();
});

// 6. Safe XSS Sanitizer (In-place string cleanup without mutating getters)
const sanitizeString = (str) => {
  if (typeof str !== "string") return str;
  return str.replace(/[<>]/g, "");
};

const cleanXSS = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === "object") {
      cleanXSS(obj[key]);
    }
  }
};

app.use((req, res, next) => {
  if (req.body) cleanXSS(req.body);
  if (req.params) cleanXSS(req.params);
  if (req.query) cleanXSS(req.query);
  next();
});

// 7. Parameter Pollution Prevention
app.use(hpp());

// 8. Static Files Serving (Product images, logos & payment QR images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 9. Multi-Tenant Resolver Middleware (API requests ke liye tenant context set karega)
app.use("/api/v1", tenantMiddleware);

// 10. API Routes Mounting
app.use("/api/v1/tenant", tenantRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/contact", contactRoutes);
app.use("/api/v1/about", aboutRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/whatsapp", whatsappRoutes);

// 11. Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// 12. 404 Handler for Unhandled API Routes (Express 5 Safe Syntax)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Requested API endpoint not found on this server."
  });
});

// 13. Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// 14. Server Startup & Safe WhatsApp Service Hook
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📁 Static files serving at: http://localhost:${PORT}/uploads`);
  console.log(`🔗 Multi-Tenant Support: Enabled for all subdomains & origins`);

  // WhatsApp engine initialization wrapped safely
  try {
    if (whatsappService && typeof whatsappService.initializeWhatsApp === "function") {
      whatsappService.initializeWhatsApp(() => {
        if (typeof processQueue === "function") {
          processQueue();
        }
      });
    }
  } catch (err) {
    console.warn("⚠️ WhatsApp Service Startup Warning:", err.message);
  }
});