import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import { ENV } from "./src/config/env.js";
import mongoose from "mongoose";

let server;

const startServer = async () => {
  try {
    await connectDB();

    server = app.listen(ENV.PORT, () => {
      console.log(`🚀 ${ENV.SERVICE_NAME} running on port ${ENV.PORT}`);
    });

    server.on("error", (err) => {
      console.error("❌ Server error:", err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

/* graceful shutdown */
const shutdown = async (signal) => {
  console.log(`🛑 ${signal} received`);

  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
