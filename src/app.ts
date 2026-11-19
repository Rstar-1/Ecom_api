import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorMiddleware, notFoundHandler, rateLimiter, UPLOAD_DIR } from "./middlewares";
import apiRoutes from "./routes";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(rateLimiter);

app.use("/uploads", express.static(UPLOAD_DIR));

app.get("/", (_req, res) => {
  res.json({ success: true, message: "Ecom API running 🚀" });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorMiddleware);

export default app;
