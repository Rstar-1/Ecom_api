import mongoose from "mongoose";

/* ================= IMAGE SCHEMA ================= */

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: "",
      trim: true,
    },
    alt: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

/* ================= CMS DATA SCHEMA ================= */

const cmsDataSchema = new mongoose.Schema(
  {
    cmsId: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "array"],
      required: true,
    },

    label: {
      type: String,
      default: "",
      trim: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: imageSchema,
      default: undefined,
    },

    // Multiple dynamic arrays with different object structures
    data: {
      type: [mongoose.Schema.Types.Mixed],
      default: undefined,
    },
  },
  { _id: false }
);

/* ================= MAIN CMS SCHEMA ================= */

const cmsSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    sectionName: {
      type: String,
      required: true,
      trim: true,
    },

    cmsData: {
      type: [cmsDataSchema],
      default: [],
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

/* ================= AUTO GENERATE CMS ID (CMS-001) ================= */
cmsSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    const Model = this.constructor || mongoose.models.CMS || mongoose.model("CMS");
    const cmsList = await Model.find({ id: /^CMS-\d+$/ }).select("id").lean();

    let maxNum = 0;
    for (const c of cmsList) {
      const match = c.id?.match(/^CMS-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const padLength = Math.max(3, String(nextNum).length);
    this.id = `CMS-${String(nextNum).padStart(padLength, "0")}`;
  }
});

const CMS = mongoose.models.CMS || mongoose.model("CMS", cmsSchema, "cms");

export default CMS;

