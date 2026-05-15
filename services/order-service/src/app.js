import express from "express";
import { middleware, utils } from "../../../shared/index.js";
import orderRoutes from "./routes/order.routes.js";



const app = express();

// ================= GLOBAL MIDDLEWARE =================
utils.configureApp(app);

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    service: "order-service",
    message: "Order Service is running 🚀",
  });
});

// ================= ROUTES =================
app.use("/api/orders", orderRoutes);

// ================= GLOBAL ERROR HANDLER =================
app.use(middleware.errorMiddleware);

export default app;
