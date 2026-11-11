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

    severity: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected"],
      default: "pending",
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
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

/* ================= AUTO GENERATE LEAD ID (LED-001) ================= */
leadSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    const Model = this.constructor || mongoose.models.Lead || mongoose.model("Lead");
    const leads = await Model.find({ id: /^LED-\d+$/ }).select("id").lean();

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
  }
});

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema, "leads");

export default Lead;

