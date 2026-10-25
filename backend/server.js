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
const couponRoutes = require("./routes/couponRoutes");

// WhatsApp Engine & Background Message Queue Services
const whatsappService = require("./services/whatsappService");
const { processQueue } = require("./services/queueService");

// Asynchronous Email Queue Processor Service
const { processEmailQueue } = require("./services/emailQueueService");

// Database Initialization
connectDB();

const app = express();

// Trust Proxy for multi-tenant subdomains & reverse proxy
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
    if (!origin) return callback(null, true);

    try {
      const url = new URL(origin);
      const host = url.hostname;

      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.endsWith(".localhost") ||
        (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)
      ) {
        return callback(null, true);
      }

      return callback(null, true);
    } catch (err) {
      return callback(new Error("CORS validation failed"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: allowedHeadersList
};

// Global CORS Middleware (Preflight OPTIONS requests ko khud handle karta hai)
app.use(cors(corsOptions));

// 3. Rate Limiting (Relaxed for Development & High Dashboard Activity)
const isDev = process.env.NODE_ENV !== "production";

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 3000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  },
  skip: (req) =>
    isDev &&
    (req.ip === "127.0.0.1" ||
      req.ip === "::1" ||
      req.ip === "::ffff:127.0.0.1")
});

app.use("/api", generalLimiter);

// 4. Body & Cookie Parsers
app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(cookieParser());

// 5. Express 5 Safe Mongo Sanitize
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

// 6. Safe XSS Sanitizer
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

// 8. Static Files Serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 9. Multi-Tenant Resolver Middleware
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
app.use("/api/v1/coupons", couponRoutes);

// 11. Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date() });
});

// 12. 404 Handler for Unhandled API Routes (Express 5 safe syntax)
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

// 14. Server Startup & Background Queues Hook
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`📁 Static files serving at: http://localhost:${PORT}/uploads`);
  console.log(`🔗 Multi-Tenant Support: Enabled for all subdomains & origins`);

  // A. Resume Pending Email Queue
  try {
    if (typeof processEmailQueue === "function") {
      processEmailQueue();
    }
  } catch (err) {
    console.warn("⚠️ Email Queue Startup Warning:", err.message);
  }

  // B. Initialize WhatsApp Service & Resume Queue
  try {
    if (
      whatsappService &&
      typeof whatsappService.initializeWhatsApp === "function"
    ) {
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