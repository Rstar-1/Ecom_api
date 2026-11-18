import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
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

    description: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    iconName: {
      type: String,
      default: "",
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
categorySchema.virtual("name").get(function () {
  return this.categoryName;
}).set(function (val) {
  this.categoryName = val;
});

/* ================= AUTO GENERATE CATEGORY ID (PCAT-001) ================= */
categorySchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    try {
      if (mongoose.connection.readyState === 1) {
        const Model = this.constructor || mongoose.models.ProductCategory || mongoose.model("ProductCategory");
        const categories = await Model.find({ id: /^PCAT-\d+$/ })
          .select("id")
          .lean()
          .maxTimeMS(5000);

        let maxNum = 0;
        for (const c of categories) {
          const match = c.id?.match(/^PCAT-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }

        const nextNum = maxNum + 1;
        const padLength = Math.max(3, String(nextNum).length);
        this.id = `PCAT-${String(nextNum).padStart(padLength, "0")}`;
      } else {
        this.id = `PCAT-${Date.now().toString().slice(-3)}`;
      }
    } catch {
      this.id = `PCAT-${Date.now().toString().slice(-3)}`;
    }
  }
});

const ProductCategory =
  mongoose.models.ProductCategory ||
  mongoose.model("ProductCategory", categorySchema, "categories");

// Ensure legacy ref: "Category" also resolves to this collection
if (!mongoose.models.Category) {
  try {
    mongoose.model("Category", categorySchema, "categories");
  } catch {}
}

export default ProductCategory;
