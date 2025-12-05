/**
 * Enhanced server.js with improved security, caching, and error handling
 */
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const NodeCache = require("node-cache");

const aiRoutes = require("./routes/ai");
const sqlRoutes = require("./routes/sql");
const formatRoutes = require("./routes/format");
const metricsRouter = require("./routes/metrics");
const fallbackRouter = require("./routes/ai-fallback");
const { logger } = require("./middleware/logger");

const app = express();

// Enhanced security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: [
          "'self'",
          "https://api.openai.com",
          "https://api.perplexity.ai",
          "https://generativelanguage.googleapis.com",
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

app.use(
  cors({
    origin: (process.env.ALLOWED_ORIGINS?.split(",") || process.env.CORS_ORIGIN || true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// Enhanced rate limiting with IP-based tracking
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.RATE_LIMIT_MAX || process.env.RATE_LIMIT_MAX_REQUESTS) || 60,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// Apply stricter rate limiting to AI endpoints
const aiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS || 20),
  message: { error: "AI request limit exceeded" },
});

app.use(limiter);
app.use("/api/ai", aiLimiter);

// Initialize cache with shorter TTL (2 minutes) and disable for AI responses
const cache = new NodeCache({ stdTTL: 120, checkperiod: 60 });
app.locals.cache = cache;
app.locals.disableAICache = true; // Disable caching for AI responses

// Request logging middleware
app.use(logger);

// Routes
app.use("/api/ai", fallbackRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/sql", sqlRoutes);
app.use("/api/format", formatRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});
app.use("/api/metrics", metricsRouter);

// AI API status endpoint
app.get("/api/ai/status", (req, res) => {
  const openaiKey = process.env.OPENAI_API_KEY;
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;

  const status = {
    timestamp: new Date().toISOString(),
    apis: {
      openai: {
        configured: !!openaiKey,
        keyPresent: openaiKey ? `${openaiKey.substring(0, 7)}...` : false,
        status: openaiKey ? "configured" : "missing",
        help: openaiKey
          ? null
          : "Get key from https://platform.openai.com/api-keys",
      },
      perplexity: {
        configured: !!perplexityKey,
        keyPresent: perplexityKey
          ? `${perplexityKey.substring(0, 7)}...`
          : false,
        status: perplexityKey ? "configured" : "missing",
        help: perplexityKey
          ? null
          : "Get key from https://www.perplexity.ai/settings/api",
      },
      gemini: {
        configured: !!googleKey,
        keyPresent: googleKey ? `${googleKey.substring(0, 7)}...` : false,
        status: googleKey ? "configured" : "missing",
        help: googleKey
          ? null
          : "Get key from https://aistudio.google.com/app/apikey",
      },
    },
    features: {
      codeGeneration: !!(openaiKey || perplexityKey),
      codeExplanation: !!(openaiKey || perplexityKey),
      research: !!perplexityKey,
      bugFix: !!openaiKey,
      codeOptimization: !!openaiKey,
      codeReview: !!openaiKey,
    },
    recommendations: [],
  };

  // Add recommendations based on configuration
  if (!openaiKey && !perplexityKey) {
    status.recommendations.push(
      "Add at least one AI API key to enable AI features",
    );
  } else if (!openaiKey) {
    status.recommendations.push(
      "Add OpenAI key for full code generation and review features",
    );
  } else if (!perplexityKey) {
    status.recommendations.push(
      "Add Perplexity key for research and up-to-date information",
    );
  }

  if (openaiKey && perplexityKey) {
    status.recommendations.push(
      "All AI features available! Try the different modes in the AI Assistant.",
    );
  }

  res.json(status);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Serve static client in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "..", "client", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "dist", "index.html"));
  });
}

const port = process.env.PORT || 4001;
const server = app.listen(port, () => {
  console.log(`🚀 AI Editor server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

module.exports = app;

