import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    severity: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "low",
      lowercase: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
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
leadSchema.virtual("leadFullName").get(function () {
  return this.name;
}).set(function (val) {
  this.name = val;
});

leadSchema.virtual("mobileNumber").get(function () {
  return this.mobile;
}).set(function (val) {
  this.mobile = val;
});

leadSchema.virtual("emailAddress").get(function () {
  return this.email;
}).set(function (val) {
  this.email = val;
});

leadSchema.virtual("requirementDetails").get(function () {
  return this.notes || this.description;
}).set(function (val) {
  this.description = val;
  this.notes = val;
});

leadSchema.virtual("publishedStatus").get(function () {
  return this.isActive;
}).set(function (val) {
  this.isActive = val;
});

/* ================= AUTO GENERATE LEAD ID (LED-001) & SYNC NOTES ================= */
leadSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    try {
      if (mongoose.connection.readyState === 1) {
        const Model =
          this.constructor || mongoose.models.Lead || mongoose.model("Lead");
        const leads = await Model.find({ id: /^LED-\d+$/ })
          .select("id")
          .lean()
          .maxTimeMS(5000);

        let maxNum = 0;
        for (const l of leads) {
          const match = l.id?.match(/^LED-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }

        const nextNum = maxNum + 1;
        const padLength = Math.max(3, String(nextNum).length);
        this.id = `LED-${String(nextNum).padStart(padLength, "0")}`;
      } else {
        this.id = `LED-${Date.now().toString().slice(-3)}`;
      }
    } catch {
      this.id = `LED-${Date.now().toString().slice(-3)}`;
    }
  }

  // Keep description and notes synchronized
  if (this.notes && !this.description) {
    this.description = this.notes;
  } else if (this.description && !this.notes) {
    this.notes = this.description;
  }
});

const Lead =
  mongoose.models.Lead || mongoose.model("Lead", leadSchema, "leads");

export default Lead;
