import express from "express";

import routes from "./routes/index.js";
import { requestId } from "./middlewares/requestId.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { middleware, utils } from "../../shared/index.js";

const app = express();

utils.configureApp(app);

app.use((req, res, next) => {
  //   console.log(`[GATEWAY] incoming ${req.method} ${req.originalUrl} payload: ${JSON.stringify(req.body)}`);
  next();
});

app.set("trust proxy", 1);

/* middleware order */
app.use(requestId);
app.use(loggerMiddleware);
app.use(middleware.rateLimiter);

/* routes */
app.use("/", routes);

export default app;