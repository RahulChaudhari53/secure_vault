const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
require("dotenv").config();
const https = require("https");
const fs = require("fs");

const app = express();
connectDB();

app.use(morgan("dev"));
app.use(
  cors({
    // origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.1.69:5173", "https://192.168.1.69:5173"], // Allow localhost and Network IP (HTTP & HTTPS)
    origin: ["http://localhost:5173", "https://192.168.1.69:5173"], // Allow localhost and Network IP (HTTPS)
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },

    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": [
          "'self'",
          "data:",
          "http://localhost:5000/uploads",
          "https://192.168.1.69:5000/uploads",
        ],

        "script-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'none'"],
      },
    },
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

const path = require("path");

// Host Header Injection Protection
app.use((req, res, next) => {
  // console.log('Host Header:', req.headers.host);
  const allowedHosts = [
    "localhost:5000",
    "127.0.0.1:5000",
    "192.168.1.69:5000",
  ];
  if (!allowedHosts.includes(req.headers.host)) {
    return res.status(403).json({ message: "Invalid Host Header" });
  }
  next();
});

// Serve Static Files (Avatars)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- Rate Limiting Strategy (Network Layer) ---
const rateLimit = require("express-rate-limit");

// OTP Verification Brute Force (5 attempts / 5min)
const otpVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts
  message: { error: "Too many OTP attempts. Try again in 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP Send Spam (3 / 1min per IP)
const otpSendLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTPs
  message: { error: "Too many OTP requests. Wait 1 minute." },
});

// Login Brute Force (10 / 15min per IP)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: { error: "Too many login attempts. Account temporarily locked." },
});

// Global Safety Net (100 / 15min)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Server busy. Too many requests." },
});

// Rate limited routes
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth/verify-otp", otpVerifyLimiter);
app.use("/api/auth/resend-otp", otpSendLimiter);
app.use(globalLimiter); // Apply to all other routes

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// --- Global Error Handler (Prevents Stack Trace Leakage) ---
app.use((err, req, res, next) => {
  console.error("Middleware Error:", err.message);

  if (
    err.message?.includes("Only images") ||
    err.message?.includes("Invalid image content") ||
    err.code === "LIMIT_FILE_MIMETYPE"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid file type. Only images (jpg, jpeg, png, webp) are allowed.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

// SSL Options
const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

https.createServer(options, app).listen(PORT, "0.0.0.0", () => {
  console.log(`[HTTPS] Secure server running on https://192.168.1.69:${PORT}`);
});
