import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    status: {
      type: String,
      required: true,
      enum: ["SUCCESS", "FAILURE"],
    },

    message: { type: String, required: true },

    category: {
      type: String,
      default: "GENERAL",
      trim: true,
    },

    updatedFields: {
      type: [String],
      default: [],
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
  },
  { timestamps: true }
);

export default mongoose.model("log", logSchema);