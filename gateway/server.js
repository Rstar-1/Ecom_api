import app from "./src/app.js";
import { env } from "./src/config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(`[GATEWAY] Running on port ${env.PORT}`);
});

server.on("error", (err) => {
  console.error("❌ Gateway error:", err.message);
  process.exit(1);
});

const shutdown = (signal) => {
  const forceTimeout = setTimeout(() => process.exit(0), 1000);
  forceTimeout.unref();

  server.close(() => process.exit(0));
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGUSR2", () => shutdown("SIGUSR2"));
