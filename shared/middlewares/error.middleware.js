import { statusCodes, messages } from "../constants/index.js";

export const errorMiddleware = (err, req, res, next) => {
  console.error("❌ Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  /* ================= MULTER ERROR ================= */
  if (err.name === "MulterError") {
    return res.status(statusCodes.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }

  /* ================= FILE TYPE ERROR ================= */
  if (err.message === "Only JPG, PNG, PDF allowed") {
    return res.status(statusCodes.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }

  /* ================= MONGO DUPLICATE KEY ERROR (E11000) ================= */
  if (err.code === 11000 || err.name === "MongoServerError") {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    return res.status(statusCodes.HTTP_STATUS.CONFLICT).json({
      success: false,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" already exists`,
    });
  }

  /* ================= MONGOOSE VALIDATION ERROR ================= */
  if (err.name === "ValidationError") {
    const messagesList = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(statusCodes.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: messagesList.join(", ") || err.message,
    });
  }

  /* ================= DEFAULT ================= */
  res.status(err.statusCode || statusCodes.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || messages.INTERNAL_SERVER_ERROR,
  });
};
