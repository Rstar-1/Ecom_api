import type { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import { connectDB } from "./config/db";
import { ENV } from "./config/env";
import { seedDatabase } from "./seeds";
import { logger } from "./utils/logger";

let server: Server | undefined;

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await seedDatabase();

    server = app.listen(ENV.PORT, () => {
      logger.info(`🚀 Ecom API running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
    });

    server.on("error", (err) => {
      logger.error(`❌ Server error: ${err.message}`);
      process.exit(1);
    });
  } catch (error) {
    logger.error(`❌ Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

const closeServer = (srv: Server): Promise<void> =>
  new Promise((resolve, reject) => srv.close((err) => (err ? reject(err) : resolve())));

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  logger.info(`🛑 ${signal} received`);
  try {
    if (server) await closeServer(server);
    if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (error) {
    logger.error(`❌ Shutdown error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
};

process.on("SIGINT", (signal) => void shutdown(signal));
process.on("SIGTERM", (signal) => void shutdown(signal));
process.on("unhandledRejection", (reason) => logger.error(`❌ Unhandled rejection: ${String(reason)}`));

void start();
