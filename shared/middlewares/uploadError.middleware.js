import { statusCodes } from "../constants/index.js";

export const uploadErrorHandler = (err, req, res, next) => {
  if (err.name === "MulterError") {
    return res.status(statusCodes.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: err.message,
    });
  }

  next(err);
};
