import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import express from "express";

export const configureApp = (app) => {
  app.use(helmet());
  app.use(cors({ origin: "*", credentials: true }));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
};
