// shared/utils/response.js
import { constants } from "../index.js";
const { statusCodes, messages: constMessages } = constants;

export const successResponse = (res, data = null, message = constMessages.SUCCESS, status = statusCodes.HTTP_STATUS.OK) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = constMessages.INTERNAL_SERVER_ERROR, status = statusCodes.HTTP_STATUS.INTERNAL_SERVER_ERROR) => {
  return res.status(status).json({
    success: false,
    message,
  });
};

export const notFoundResponse = (res, message = constMessages.NOT_FOUND) => {
  return res.status(statusCodes.HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message,
  });
};

export const validationErrorResponse = (res, errors = [], message = constMessages.INVALID_INPUT) => {
  return res.status(statusCodes.HTTP_STATUS.BAD_REQUEST).json({
    success: false,
    message,
    errors,
  });
};