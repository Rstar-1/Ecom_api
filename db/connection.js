import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const DB = process.env.DATABASE;

const connectDB = async () => {
  try {
    await mongoose.connect(DB); // Mongoose 6+ handles options automatically
    console.log(`✅  DB Connected Successfully`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1); // Stop app if DB connection fails
  }
};

export default connectDB;
