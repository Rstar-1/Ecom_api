import { ENV } from "../../config/env";
import { Otp, type OtpPurpose } from "../../models";
import { AppError, logger } from "../../utils";
import type { OtpTarget } from "./auth.types";

const generateOtp = (): string => String(Math.floor(1000 + Math.random() * 9000));

const contactFilter = ({ mobile, email }: OtpTarget) => ({
  ...(mobile ? { mobile } : {}),
  ...(email ? { email } : {}),
});

/* ================= SEND OTP ================= */
export const generateAndSendOtp = async ({
  mobile,
  email,
  purpose = "REGISTER",
}: OtpTarget & { purpose?: OtpPurpose }): Promise<string> => {
  if (!mobile && !email) throw AppError.badRequest("Mobile or Email required");

  const otp = generateOtp();

  await Otp.findOneAndUpdate(
    { purpose, ...contactFilter({ mobile, email }) },
    {
      $set: {
        mobile: mobile ?? null,
        email: email ?? null,
        code: otp,
        purpose,
        isVerified: false,
        attempts: 0,
        expiresAt: new Date(Date.now() + ENV.OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // TODO: deliver the OTP via SMS/email (Twilio / SMTP settings exist in env).
  logger.info(`OTP_SENT (${purpose}): ${mobile ?? email}`);
  return otp;
};

/* ================= VERIFY OTP ================= */
export const verifyOtp = async ({
  mobile,
  email,
  otp,
  purpose = "REGISTER",
}: OtpTarget & { otp: string; purpose?: OtpPurpose }): Promise<void> => {
  if (!mobile && !email) throw AppError.badRequest("Mobile or Email required");

  const record = await Otp.findOne({
    code: otp,
    purpose,
    expiresAt: { $gt: new Date() },
    ...contactFilter({ mobile, email }),
  });

  if (!record) throw AppError.badRequest("Invalid or expired OTP");

  await Otp.updateOne({ _id: record._id }, { $set: { isVerified: true }, $inc: { attempts: 1 } });

  logger.info(`OTP_VERIFIED (${purpose}): ${mobile ?? email}`);
};
