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
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

/* ================= AUTO GENERATE CATEGORY ID ================= */
categorySchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    const Model = this.constructor || mongoose.models.ProductCategory || mongoose.model("ProductCategory");
    const categories = await Model.find({ id: /^PCAT-\d+$/ })
      .select("id")
      .lean();

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
  }
});

const ProductCategory =
  mongoose.models.ProductCategory ||
  mongoose.model("ProductCategory", categorySchema, "categories");

// Ensure legacy ref: "Category" also resolves to this collection
if (!mongoose.models.Category) {
  mongoose.model("Category", categorySchema, "categories");
}

export default ProductCategory;
