import { utils, models } from "../../../../../shared/index.js";

const { info } = utils;
const { Otp } = models;

/* ================= GENERATE OTP ================= */
const generateOtp = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

/* ================= SEND OTP ================= */
export const generateAndSendOtp = async ({
  mobile,
  email,
  purpose = "REGISTER",
}) => {
  if (!mobile && !email) {
    throw new Error("Mobile or Email required");
  }

  const otp = generateOtp();

  const filter = {
    purpose,
    ...(mobile ? { mobile } : {}),
    ...(email ? { email } : {}),
  };

  try {
    const result = await Otp.findOneAndUpdate(
      filter,
      {
        $set: {
          mobile: mobile || null,
          email: email || null,
          code: otp,
          purpose,
          isVerified: false,
          attempts: 0,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      },
      {
        upsert: true,
        returnDocument: "after", // ✅ FIXED (no warning)
      }
    );

    console.log("[OTP STORED]", result);
    info(`OTP_SENT: ${mobile || email}`);

    return otp;
  } catch (err) {
    console.error("OTP ERROR:", err);
    throw new Error("Failed to generate OTP");
  }
};

/* ================= VERIFY OTP ================= */
export const verifyOtp = async ({ mobile, email, otp }) => {
  if (!mobile && !email) {
    throw new Error("Mobile or Email required");
  }

  const filter = {
    code: otp,
    purpose: "REGISTER",
    expiresAt: { $gt: new Date() },
    ...(mobile ? { mobile } : {}),
    ...(email ? { email } : {}),
  };

  const record = await Otp.findOne(filter);

  if (!record) {
    throw new Error("Invalid or expired OTP");
  }

  /* ================= UPDATE INSTEAD OF DELETE ================= */
  await Otp.updateOne(
    { _id: record._id },
    {
      $set: {
        isVerified: true,
      },
      $inc: {
        attempts: 1,
      },
    }
  );

  info(`OTP_VERIFIED: ${mobile || email}`);

  return true;
};