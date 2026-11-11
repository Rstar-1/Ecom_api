import mongoose from "mongoose";

/* ================= BREADCRUMB SCHEMA ================= */

const breadcrumbSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

/* ================= MAIN SEO SCHEMA ================= */

const seoSchema = new mongoose.Schema(
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

    page: {
      type: String,
      default: "",
      trim: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    keywords: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    type: {
      type: String,
      enum: ["website", "article", "product", "business"],
      default: "website",
      lowercase: true,
      trim: true,
    },

    noindex: {
      type: Boolean,
      default: false,
    },

    breadcrumbs: {
      type: [breadcrumbSchema],
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

/* ================= AUTO GENERATE SEO ID (SEO-001) ================= */
seoSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    const Model = this.constructor || mongoose.models.SEO || mongoose.model("SEO");
    const seoList = await Model.find({ id: /^SEO-\d+$/ }).select("id").lean();

    let maxNum = 0;
    for (const s of seoList) {
      const match = s.id?.match(/^SEO-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const padLength = Math.max(3, String(nextNum).length);
    this.id = `SEO-${String(nextNum).padStart(padLength, "0")}`;
  }

  if (!this.page && this.name) {
    this.page = this.name;
  }
});

const SEO = mongoose.models.SEO || mongoose.model("SEO", seoSchema, "seos");

export default SEO;

