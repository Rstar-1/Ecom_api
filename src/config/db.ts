import mongoose from "mongoose";
import { ENV } from "./env";

export const connectDB = async (): Promise<void> => {
  await mongoose.connect(ENV.DATABASE, {
    autoIndex: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
  });
  console.log("✅ MongoDB connected");
};
