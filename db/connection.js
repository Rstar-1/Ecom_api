import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env", quiet: true });

const DB = process.env.DATABASE;

const connectDB = async () => {
  try {
    await mongoose.connect(DB);
    console.log(`🚀 DB Connected Successfully 🚀`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

export default connectDB;
