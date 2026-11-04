import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import routes from "./routes/index.js";
import { requestId } from "./middlewares/requestId.middleware.js";
import { loggerMiddleware } from "./middlewares/logger.middleware.js";
import { middleware } from "../../shared/index.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));

app.set("trust proxy", 1);

/* middleware order */
app.use(requestId);
app.use(loggerMiddleware);
app.use(middleware.rateLimiter);

/* routes */
app.use("/", routes);

export default app;
