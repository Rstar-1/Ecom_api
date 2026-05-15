import { constants } from "../index.js";
const { statusCodes, messages } = constants;

export const errorMiddleware = (err, req, res, next) => {
  console.error("❌ Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  /* ================= MULTER ERROR (NO IMPORT) ================= */
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

  /* ================= DEFAULT ================= */
  res.status(err.statusCode || statusCodes.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: err.message || messages.INTERNAL_SERVER_ERROR,
  });
};