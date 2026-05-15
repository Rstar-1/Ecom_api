import mongoose from "mongoose";
import { ENV } from "./env.js";

const connectDB = async () => {
  try {
    await mongoose.connect(ENV.DATABASE, {
      autoIndex: true,
      tls: true,
      tlsAllowInvalidCertificates: true,
    });
    console.log(`MongoDB Connected [${ENV.SERVICE_NAME}]`);
  } catch (err) {
    console.error("DB Connection Failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
