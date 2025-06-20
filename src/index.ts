import dotenv from "dotenv";
import { startWorker } from "./worker.js";
import { startServer } from "./server.js";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Starting Smut Writer Worker...");
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔧 Poll interval: ${process.env.POLL_INTERVAL_MS || 5000}ms`);
  console.log(`♻️  Max retries: ${process.env.MAX_RETRIES || 2}`);
  console.log(`🔄 Concurrency: ${process.env.WORKER_CONCURRENCY || 2}`);

  try {
    // Start health check server first
    console.log("\n🌐 Starting health check server...");
    startServer();

    // Small delay to ensure server is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the worker loop
    console.log("\n⚡ Starting worker process...");
    await startWorker();
  } catch (error) {
    console.error("💥 Fatal error:", error);
    process.exit(1);
  }
}

// Handle uncaught exceptions and rejections
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  console.error("💥 Failed to start application:", error);
  process.exit(1);
});