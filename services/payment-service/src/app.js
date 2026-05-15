import express from "express";
import { middleware, utils } from "../../../shared/index.js";
import paymentRoutes from "./routes/payment.routes.js";



const app = express();

// ================= GLOBAL MIDDLEWARE =================
utils.configureApp(app);

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    service: "payment-service",
    message: "Payment Service is running 🚀",
  });
});

// ================= ROUTES =================
app.use("/api/payments", paymentRoutes);

// ================= GLOBAL ERROR HANDLER =================
app.use(middleware.errorMiddleware);

export default app;
