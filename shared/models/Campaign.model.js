import mongoose from "mongoose";

/**
 * ============================================================================
 * RECIPIENT SUB-SCHEMA (Target Leads / Customers & Twilio Message Tracking)
 * ============================================================================
 */
const recipientSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      default: null,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Destination address: Phone number (SMS/WhatsApp) or Email (Gmail)
    recipientAddress: {
      type: String,
      required: true,
      trim: true,
    },

    recipientType: {
      type: String,
      enum: ["Lead", "Customer", "Other"],
      default: "Lead",
      trim: true,
    },

    // Twilio delivery lifecycle state
    status: {
      type: String,
      enum: [
        "pending",
        "queued",
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
        "undelivered",
      ],
      default: "pending",
      lowercase: true,
      trim: true,
    },

    // Twilio Message SID (SM... for SMS, MM... / SM... for WhatsApp, or SendGrid Message ID)
    twilioMessageSid: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    // Twilio error codes (e.g. 30008, 63007) and human readable message
    errorCode: {
      type: String,
      default: "",
      trim: true,
    },

    errorMessage: {
      type: String,
      default: "",
      trim: true,
    },

    // Twilio SMS segment calculations (e.g. 1 segment = 160 GSM chars)
    segmentsCount: {
      type: Number,
      default: 1,
      min: 1,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: true,
    timestamps: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

recipientSchema.virtual("mobile").get(function () {
  return this.recipientAddress;
}).set(function (val) {
  this.recipientAddress = val;
});

recipientSchema.virtual("phone").get(function () {
  return this.recipientAddress;
}).set(function (val) {
  this.recipientAddress = val;
});

recipientSchema.virtual("email").get(function () {
  return this.recipientAddress;
}).set(function (val) {
  this.recipientAddress = val;
});

recipientSchema.pre("validate", function () {
  if (!this.recipientAddress) {
    this.recipientAddress = this.mobile || this.phone || this.email || "";
  }
});

/**
 * ============================================================================
 * MAIN CAMPAIGN SCHEMA
 * ============================================================================
 */
const campaignSchema = new mongoose.Schema(
  {
    // Auto-generated Unique Campaign ID (e.g. CMP-001)
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    // Campaign Name (e.g. "Festive offer - November")
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Communication Channel
    channel: {
      type: String,
      required: true,
      enum: ["whatsapp", "sms", "gmail"],
      lowercase: true,
      trim: true,
      index: true,
    },

    // Core Template Type matching UI sections
    templateType: {
      type: String,
      enum: ["promotion", "otp", "welcome", "custom"],
      default: "promotion",
      lowercase: true,
      trim: true,
      index: true,
    },

    // Overall Campaign Execution Status
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "draft",
      lowercase: true,
      trim: true,
      index: true,
    },

    /* ================= TEMPLATE & MESSAGE CONTENT FIELDS ================= */

    // Header text (e.g. "Welcome to [Company]" for WhatsApp/Gmail)
    header: {
      type: String,
      default: "",
      trim: true,
    },

    // Subject line (primarily used in Gmail)
    subject: {
      type: String,
      default: "",
      trim: true,
    },

    // Pre-header / Inbox preview text (Gmail)
    previewText: {
      type: String,
      default: "",
      trim: true,
    },

    // Main campaign message body (interpolates variables like {name}, {company})
    body: {
      type: String,
      required: true,
      trim: true,
    },

    // Footer text / Opt-out notice (e.g. "Reply STOP to opt out" / Unsubscribe link)
    footer: {
      type: String,
      default: "",
      trim: true,
    },

    // Special Offer Visual Banner (WhatsApp & Gmail promotion template)
    bannerIncluded: {
      type: Boolean,
      default: false,
    },

    bannerType: {
      type: String,
      default: "special_offer",
      trim: true,
    },

    bannerImageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Interactive Button Actions (WhatsApp Quick Reply / Link CTA, Gmail CTA)
    buttonLabel: {
      type: String,
      default: "",
      trim: true,
    },

    buttonType: {
      type: String,
      enum: ["reply", "url", "copy_code", "none"],
      default: "none",
      lowercase: true,
      trim: true,
    },

    buttonUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Trackable Short Link (SMS Promotion, e.g. https://yourbrand.in/s/x7Qa)
    shortUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // OTP Code (Security Verification templates)
    otpCode: {
      type: String,
      default: "",
      trim: true,
    },

    // Security disclaimer note (OTP templates)
    securityNote: {
      type: String,
      default: "",
      trim: true,
    },

    /* ================= TWILIO & SENDER INTEGRATION CONFIGURATION ================= */
    twilioConfig: {
      // Sender Phone Number (e.g. "+1234567890" for SMS or "whatsapp:+14155238886")
      fromNumber: {
        type: String,
        default: "",
        trim: true,
      },

      // Sender Email Address (e.g. "offers@yourbrand.in" for Gmail/SendGrid)
      fromEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
      },

      // Twilio Messaging Service SID (MG...)
      messagingServiceSid: {
        type: String,
        default: "",
        trim: true,
      },

      // Twilio / Meta WhatsApp Approved Content Template SID (HX...)
      whatsappContentSid: {
        type: String,
        default: "",
        trim: true,
      },

      // Webhook URL for Twilio Delivery Status Callbacks
      statusCallbackUrl: {
        type: String,
        default: "",
        trim: true,
      },

      // Optional account reference if multi-tenant
      accountSid: {
        type: String,
        default: "",
        trim: true,
      },
    },

    /* ================= TARGET AUDIENCE & RECIPIENTS LIST ================= */
    recipients: [recipientSchema],

    /* ================= PERFORMANCE AGGREGATE METRICS ================= */
    metrics: {
      totalRecipients: { type: Number, default: 0 },
      queuedCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      readCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },

    /* ================= METADATA & AUDIT FIELDS ================= */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },

    scheduledAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/* ================= VIRTUALS FOR UI FIELD COMPATIBILITY ================= */

// Map campaignName <-> name for Campaign.jsx formData
campaignSchema
  .virtual("campaignName")
  .get(function () {
    return this.name;
  })
  .set(function (val) {
    this.name = val;
  });

// Map fromEmail for Gmail Section
campaignSchema
  .virtual("fromEmail")
  .get(function () {
    return this.twilioConfig?.fromEmail || "";
  })
  .set(function (val) {
    if (!this.twilioConfig) this.twilioConfig = {};
    this.twilioConfig.fromEmail = val;
  });

campaignSchema
  .virtual("senderEmailAddress")
  .get(function () {
    return this.twilioConfig?.fromEmail || "";
  })
  .set(function (val) {
    if (!this.twilioConfig) this.twilioConfig = {};
    this.twilioConfig.fromEmail = val;
  });

campaignSchema
  .virtual("trackableShortLink")
  .get(function () {
    return this.shortUrl || "";
  })
  .set(function (val) {
    this.shortUrl = val;
  });

campaignSchema
  .virtual("smsMessageBody")
  .get(function () {
    return this.body || "";
  })
  .set(function (val) {
    this.body = val;
  });

campaignSchema
  .virtual("subjectLine")
  .get(function () {
    return this.subject || "";
  })
  .set(function (val) {
    this.subject = val;
  });

campaignSchema
  .virtual("specialOfferBannerIncluded")
  .get(function () {
    return this.bannerIncluded;
  })
  .set(function (val) {
    this.bannerIncluded = Boolean(val);
  });

// Target audience total count
campaignSchema.virtual("targetAudienceCount").get(function () {
  return this.recipients
    ? this.recipients.length
    : this.metrics?.totalRecipients || 0;
});

// Delivery success percentage rate
campaignSchema.virtual("deliveryRate").get(function () {
  const total =
    this.metrics?.totalRecipients ||
    (this.recipients ? this.recipients.length : 0);
  if (!total) return 0;
  const delivered = this.metrics?.deliveredCount || 0;
  return Math.round((delivered / total) * 100);
});

/* ================= AUTO GENERATE CAMPAIGN ID (CMP-001) & SYNC METRICS ================= */
campaignSchema.pre("validate", async function () {
  // 1. Auto-generate sequential Campaign ID (CMP-001)
  if (!this.id || !this.id.trim()) {
    try {
      if (mongoose.connection.readyState === 1) {
        const Model =
          this.constructor ||
          mongoose.models.Campaign ||
          mongoose.model("Campaign");

        const campaigns = await Model.find({ id: /^CMP-\d+$/ })
          .select("id")
          .lean()
          .maxTimeMS(5000);

        let maxNum = 0;
        for (const c of campaigns) {
          const match = c.id?.match(/^CMP-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }

        const nextNum = maxNum + 1;
        const padLength = Math.max(3, String(nextNum).length);
        this.id = `CMP-${String(nextNum).padStart(padLength, "0")}`;
      } else {
        this.id = `CMP-${Date.now().toString().slice(-3)}`;
      }
    } catch {
      this.id = `CMP-${Date.now().toString().slice(-3)}`;
    }
  }

  // 2. Synchronize aggregate metrics from recipients list
  if (Array.isArray(this.recipients)) {
    this.metrics = this.metrics || {};
    this.metrics.totalRecipients = this.recipients.length;

    let queued = 0;
    let sent = 0;
    let delivered = 0;
    let read = 0;
    let failed = 0;

    for (const r of this.recipients) {
      if (r.status === "queued" || r.status === "pending") queued++;
      else if (r.status === "sent" || r.status === "sending") sent++;
      else if (r.status === "delivered") delivered++;
      else if (r.status === "read") read++;
      else if (r.status === "failed" || r.status === "undelivered") failed++;
    }

    this.metrics.queuedCount = queued;
    this.metrics.sentCount = sent;
    this.metrics.deliveredCount = delivered;
    this.metrics.readCount = read;
    this.metrics.failedCount = failed;
  }

  // 3. Set default banner included flag for promotional templates if not explicitly toggled
  if (this.templateType === "promotion" && this.bannerIncluded === undefined) {
    this.bannerIncluded = true;
  }
});

/* ================= HELPER METHODS FOR TWILIO WEBHOOKS ================= */

/**
 * Updates an individual recipient's delivery status when a Twilio StatusCallback webhook triggers.
 * Automatically recalculates aggregate campaign metrics.
 */
campaignSchema.methods.updateRecipientTwilioStatus = function (
  messageSid,
  newStatus,
  errorDetails = {},
) {
  if (!this.recipients || !this.recipients.length) return false;

  const recipient = this.recipients.find(
    (r) => r.twilioMessageSid === messageSid,
  );

  if (!recipient) return false;

  recipient.status = newStatus;

  if (newStatus === "sent") {
    recipient.sentAt = new Date();
  } else if (newStatus === "delivered") {
    recipient.deliveredAt = new Date();
  } else if (newStatus === "read") {
    recipient.readAt = new Date();
  } else if (newStatus === "failed" || newStatus === "undelivered") {
    recipient.errorCode = errorDetails.errorCode || "";
    recipient.errorMessage = errorDetails.errorMessage || "";
  }

  // Recalculate metrics
  let queued = 0;
  let sent = 0;
  let delivered = 0;
  let read = 0;
  let failed = 0;

  for (const r of this.recipients) {
    if (r.status === "queued" || r.status === "pending") queued++;
    else if (r.status === "sent" || r.status === "sending") sent++;
    else if (r.status === "delivered") delivered++;
    else if (r.status === "read") read++;
    else if (r.status === "failed" || r.status === "undelivered") failed++;
  }

  this.metrics.queuedCount = queued;
  this.metrics.sentCount = sent;
  this.metrics.deliveredCount = delivered;
  this.metrics.readCount = read;
  this.metrics.failedCount = failed;

  // If all recipients are finished (delivered / failed / read), mark campaign as completed
  const total = this.recipients.length;
  if (total > 0 && delivered + read + failed === total) {
    this.status = "completed";
    this.completedAt = new Date();
  }

  return true;
};

/**
 * Static finder to look up a campaign by Twilio Message SID
 */
campaignSchema.statics.findByTwilioSid = function (messageSid) {
  return this.findOne({ "recipients.twilioMessageSid": messageSid });
};

const Campaign =
  mongoose.models.Campaign ||
  mongoose.model("Campaign", campaignSchema, "campaigns");

export default Campaign;
