import mongoose from "mongoose";

const blogCategorySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    categoryName: {
      type: String,
      required: true,
      trim: true,
    },

    count: {
      type: Number,
      default: 0,
      min: 0,
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
  }
);

/* ================= VIRTUALS ================= */
blogCategorySchema.virtual("name").get(function () {
  return this.categoryName;
}).set(function (val) {
  this.categoryName = val;
});

/* ================= AUTO GENERATE BLOG CATEGORY ID (BCAT-001) ================= */
blogCategorySchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    try {
      if (mongoose.connection.readyState === 1) {
        const Model = this.constructor || mongoose.models.BlogCategory || mongoose.model("BlogCategory");
        const categories = await Model.find({ id: /^BCAT-\d+$/ })
          .select("id")
          .lean()
          .maxTimeMS(5000);

        let maxNum = 0;
        for (const c of categories) {
          const match = c.id?.match(/^BCAT-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }

        const nextNum = maxNum + 1;
        const padLength = Math.max(3, String(nextNum).length);
        this.id = `BCAT-${String(nextNum).padStart(padLength, "0")}`;
      } else {
        this.id = `BCAT-${Date.now().toString().slice(-3)}`;
      }
    } catch {
      this.id = `BCAT-${Date.now().toString().slice(-3)}`;
    }
  }
});

const BlogCategory =
  mongoose.models.BlogCategory ||
  mongoose.model("BlogCategory", blogCategorySchema, "blogcategories");

export default BlogCategory;
