import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import dns from "dns";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

import { initDatabase } from "./config/db.js";
import { runStartupPreflight } from "./config/preflight.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { uploadsDir, uploadsPublicPath } from "./config/uploads.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction =
  (process.env.NODE_ENV || "").toLowerCase() === "production";

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  process.env.FLY_APP_NAME
    ? `https://${process.env.FLY_APP_NAME}.fly.dev`
    : null,
  !isProduction ? "http://localhost:5173" : null,
]
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ""));

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, "");
      if (allowedOrigins.length === 0 || allowedOrigins.includes(normalized)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// SSE notification subscription — registered before the rate limiter because
// each SSE connection is a persistent, long-lived HTTP request and must not
// compete with the per-IP request budget.
app.use("/api/notifications", notificationRoutes);

// Rate limiting
//
// Campus context: ~10 000 students on a shared campus WiFi — all traffic
// originates from the same small pool of NAT-ted IPs. Pure IP-based limits
// would fire constantly. Strategy:
//   1. Global IP limiter — high ceiling, just blocks genuine floods.
//   2. Auth IP limiter  — tighter, protects login/register/password flows.
//   3. Order action limiter — keyed by authenticated USER ID so individual
//      abuse is still caught while the shared IP never fires.

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3000, // ~10k students sharing a few IPs — ceiling must be very high
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});
app.use("/api/", limiter);

// Auth-specific limit — per IP, but generous enough for a shared network.
// Covers login / register / forgot-password / verify-email.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
});
app.use("/api/auth/", authLimiter);

// Order action limiter — keyed by USER ID (falls back to IP for unauthenticated
// requests). This prevents a single user from spamming order actions while
// keeping the shared campus IP from being the bottleneck.
// NOTE: req.user isn't set yet at middleware registration time, so we decode
// the JWT payload directly (no verification — just for bucketing, not auth).
const orderActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300, // per user per 15 min — very generous for normal usage
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (token) {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
        );
        if (payload?.id) return `user:${payload.id}`;
      }
    } catch {}
    return req.ip;
  },
  message: {
    success: false,
    message: "Too many order actions. Please try again later.",
  },
});
app.use("/api/orders/", orderActionLimiter);

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Static files
app.use(uploadsPublicPath, express.static(uploadsDir));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "CampusBite API is running.",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
// notification route is already mounted above the rate limiter

if (isProduction) {
  const frontendDistPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDistPath));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    runStartupPreflight();
    await initDatabase();
    console.log("[Startup] Database initialized successfully.");

    app.listen(PORT, () => {
      console.log(
        `CampusBite server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`,
      );
    });
  } catch (error) {
    console.error("[Startup] Failed to start server.");
    console.error(`[Startup] ${error.message}`);
    if (error.cause?.message) {
      console.error(`[Startup] Cause: ${error.cause.message}`);
    }
    process.exit(1);
  }
};

startServer();

export default app;
