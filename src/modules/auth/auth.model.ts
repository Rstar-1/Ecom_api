import { Schema, model, type InferSchemaType } from "mongoose";

export const OTP_PURPOSES = ["LOGIN", "REGISTER", "FORGOT_PASSWORD"] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

const otpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    mobile: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    code: { type: String, required: true },
    purpose: { type: String, enum: OTP_PURPOSES, default: "REGISTER" },
    isVerified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true, versionKey: false }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ mobile: 1 });
otpSchema.index({ email: 1 });
otpSchema.index({ code: 1 });

export type IOtp = InferSchemaType<typeof otpSchema>;
export const Otp = model("Otp", otpSchema);
