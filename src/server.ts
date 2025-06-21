import cors from "cors";
import express from "express";
import helmet from "helmet";
import { supabase } from "./lib/supabase.js";
import { HEALTH_STATUS, JOB_STATUS } from "./lib/constants/status.js";

const app = express();
const PORT = process.env.PORT || 3951;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from("generation_jobs")
      .select("count", { count: "exact" })
      .limit(1);

    if (error) {
      throw error;
    }

    res.json({
      status: HEALTH_STATUS.HEALTHY,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "connected",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: HEALTH_STATUS.UNHEALTHY,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    });
  }
});

// Basic info endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Smut Writer Worker",
    version: "1.0.0",
    description: "Background worker service for story generation",
    endpoints: {
      health: "/health",
      metrics: "/metrics (coming soon)",
    },
  });
});

// Metrics endpoint (basic implementation)
app.get("/metrics", async (req, res) => {
  try {
    // Get job statistics
    const { data: pendingJobs, error: pendingError } = await supabase
      .from("generation_jobs")
      .select("count", { count: "exact" })
      .eq("status", JOB_STATUS.PENDING);

    const { data: processingJobs, error: processingError } = await supabase
      .from("generation_jobs")
      .select("count", { count: "exact" })
      .eq("status", JOB_STATUS.PROCESSING);

    const { data: completedJobs, error: completedError } = await supabase
      .from("generation_jobs")
      .select("count", { count: "exact" })
      .eq("status", JOB_STATUS.COMPLETED);

    const { data: failedJobs, error: failedError } = await supabase
      .from("generation_jobs")
      .select("count", { count: "exact" })
      .eq("status", JOB_STATUS.FAILED);

    if (pendingError || processingError || completedError || failedError) {
      throw new Error("Failed to fetch job metrics");
    }

    res.json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      jobs: {
        pending: pendingJobs?.[0]?.count || 0,
        processing: processingJobs?.[0]?.count || 0,
        completed: completedJobs?.[0]?.count || 0,
        failed: failedJobs?.[0]?.count || 0,
      },
      worker: {
        pollInterval: process.env.POLL_INTERVAL_MS || "5000",
        maxRetries: process.env.MAX_RETRIES || "2",
        concurrency: process.env.WORKER_CONCURRENCY || "2",
      },
    });
  } catch (error) {
    console.error("Metrics fetch failed:", error);
    res.status(500).json({
      error: "Failed to fetch metrics",
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Server error:", err);
    res.status(500).json({
      error: "Internal server error",
      timestamp: new Date().toISOString(),
    });
  }
);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
    timestamp: new Date().toISOString(),
  });
});

export function startServer() {
  const server = app.listen(PORT, () => {
    console.log("🌐 Starting health check server");
    console.log(`📡 Server listening on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📈 Metrics: http://localhost:${PORT}/metrics`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("📡 Received SIGTERM, shutting down health server...");
    server.close(() => {
      console.log("🛑 Health server shut down gracefully");
    });
  });

  process.on("SIGINT", () => {
    console.log("📡 Received SIGINT, shutting down health server...");
    server.close(() => {
      console.log("🛑 Health server shut down gracefully");
      process.exit(0);
    });
  });

  return server;
}
