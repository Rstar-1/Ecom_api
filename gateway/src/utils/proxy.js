import { createProxyMiddleware } from "http-proxy-middleware";
import { constants } from "../../../shared/index.js";
const { statusCodes } = constants;

export const createProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    timeout: 60000,
    proxyTimeout: 60000,
    pathRewrite: (path, req) => req.originalUrl,

    onError: (err, req, res) => {
      console.error("[PROXY ERROR]", err.message);

      if (!res.headersSent) {
        res.status(statusCodes.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: "Gateway error",
          error: err.message
        });
      }
    }
  });
};
