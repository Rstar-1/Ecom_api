import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    mobile: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    code: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["LOGIN", "REGISTER", "FORGOT_PASSWORD"],
      default: "REGISTER",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true, // ✅ no index here
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ================= TTL INDEX ================= */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/* ================= FAST LOOKUP ================= */
otpSchema.index({ mobile: 1 });
otpSchema.index({ email: 1 });
otpSchema.index({ code: 1 });

export default mongoose.model("Otp", otpSchema);