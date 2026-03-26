// ---------------------- IMPORT PACKAGES ---------------------- //
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ---------------------- LOAD ENV ---------------------- //
dotenv.config({ path: ".env" });

// ---------------------- __dirname FIX ---------------------- //
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------- CREATE EXPRESS APP ---------------------- //
const app = express();

// ---------------------- MIDDLEWARE ---------------------- //
app.use(express.json()); // parse JSON body
app.use(express.urlencoded({ extended: true })); // parse URL-encoded body
app.use(cors());

// ---------------------- UPLOAD FOLDERS ---------------------- //
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir));

const filesDir = path.join(__dirname, "public/files");
if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir, { recursive: true });
app.use("/files", express.static(filesDir));

// ---------------------- DATABASE CONNECTION ---------------------- //
import connectDB from "./db/connection.js";
connectDB();

// ---------------------- ROUTES ---------------------- //
import mainroute from "./routes/Index.js"; // must have default export
mainroute(app); // attach all routes

// ---------------------- ROOT ROUTE ---------------------- //
app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is Running!" });
});

// ---------------------- START SERVER ---------------------- //
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server Running on Port: ${PORT} 🚀`);
});