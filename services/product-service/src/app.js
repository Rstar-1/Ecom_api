import express from "express"
import { middleware, utils } from "../../../shared/index.js"

import productRoutes from "./routes/product.routes.js"
import categoryRoutes from "./routes/category.routes.js"



const app = express()

// ================= GLOBAL MIDDLEWARE =================
utils.configureApp(app)

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    service: "product-service",
    message: "Product Service is running 🚀"
  })
})

// ================= ROUTES =================
app.use("/api/products", productRoutes)
app.use("/api/categories", categoryRoutes)

// ================= GLOBAL ERROR HANDLER =================
app.use(middleware.errorMiddleware)

export default app
