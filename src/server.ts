import type { Server } from "http";
import mongoose from "mongoose";
import { ENV } from "./config/env";
import { connectDB } from "./config/db";
import app from "./app";
import { seedInitialRoles } from "./modules/roles/role.seed";
import { seedInitialSeo } from "./modules/seo/seo.service";

let server: Server | undefined;

const start = async (): Promise<void> => {
  try {
    await connectDB();
    await seedInitialRoles().catch((error: unknown) =>
      console.warn("⚠️ Role seed skipped:", error instanceof Error ? error.message : error)
    );
    // Populate the 12 default page SEO records when the collection is empty
    await seedInitialSeo().catch((error: unknown) =>
      console.warn("⚠️ SEO seed skipped:", error instanceof Error ? error.message : error)
    );
    server = app.listen(ENV.PORT, () => {
      console.log(`🚀 Ecom API running on port ${ENV.PORT} [${ENV.NODE_ENV}]`);
    });
    server.on("error", (err) => {
      console.error("❌ Server error:", err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

const closeServer = (srv: Server): Promise<void> =>
  new Promise((resolve, reject) => srv.close((err) => (err ? reject(err) : resolve())));

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  console.log(`🛑 ${signal} received`);
  try {
    if (server) await closeServer(server);
    if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

process.on("SIGINT", (signal) => void shutdown(signal));
process.on("SIGTERM", (signal) => void shutdown(signal));
process.on("unhandledRejection", (reason) => console.error("❌ Unhandled rejection:", reason));

void start();
