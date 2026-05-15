import { producer as kafkaProducer } from "../../../kafka/client/kafkaClient.js";

const TOPIC = {
  OTP_SENT: "auth.otp.sent",
  OTP_VERIFIED: "auth.otp.verified",
  OTP_FAILED: "auth.otp.failed",
};

// ================= OTP SENT =================
export const emitOtpSent = async (mobile, otp) => {
  try {
    await kafkaProducer.send({
      topic: TOPIC.OTP_SENT,
      messages: [
        {
          key: mobile,
          value: JSON.stringify({
            mobile,
            // ⚠️ SECURITY: avoid sending OTP in real production logs/events
            otp,
            sentAt: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error("❌ Kafka OTP_SENT event failed:", err.message);
  }
};

// ================= OTP VERIFIED =================
export const emitOtpVerified = async (mobile) => {
  try {
    await kafkaProducer.send({
      topic: TOPIC.OTP_VERIFIED,
      messages: [
        {
          key: mobile,
          value: JSON.stringify({
            mobile,
            verifiedAt: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error("❌ Kafka OTP_VERIFIED event failed:", err.message);
  }
};

// ================= OTP FAILED =================
export const emitOtpFailed = async (mobile, reason = "invalid_otp") => {
  try {
    await kafkaProducer.send({
      topic: TOPIC.OTP_FAILED,
      messages: [
        {
          key: mobile,
          value: JSON.stringify({
            mobile,
            reason,
            failedAt: new Date().toISOString(),
          }),
        },
      ],
    });
  } catch (err) {
    console.error("❌ Kafka OTP_FAILED event failed:", err.message);
  }
};