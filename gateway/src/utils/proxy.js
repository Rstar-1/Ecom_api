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
    logLevel: "debug",


    onProxyReq: (proxyReq, req, res) => {
      // console.log("[PROXY] request", req.method, req.originalUrl, "->", target);

      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);

        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);

        // console.log("[PROXY] forwarded body:", bodyData);
      }
    },

    onProxyRes: (proxyRes, req, res) => {
      // console.log(
      //   `[PROXY] response from target ${target} ${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`
      // );
    },

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