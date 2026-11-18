import mongoose from "mongoose";

// Specifications Schema
const specificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    value: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { _id: false }
);

// Reviews Schema
const reviewSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
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
  }
);

// Product Schema
const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    shortDesc: {
      type: String,
      default: "",
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      default: "Pcs",
    },

    currency: {
      type: String,
      default: "INR",
    },

    totalStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },

    stockStatus: {
      type: Boolean,
      default: true,
    },

    isTrending: {
      type: Boolean,
      default: false,
    },

    severity: {
      type: String,
      enum: ["pending", "approved", "rejected", "low", "medium", "high"],
      default: "pending",
      lowercase: true,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    badges: {
      type: [String],
      default: [],
    },

    specifications: {
      type: [specificationSchema],
      default: [],
    },

    reviews: {
      type: [reviewSchema],
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
productSchema.virtual("name").get(function () {
  return this.productName;
}).set(function (val) {
  this.productName = val;
});

/* ================= AUTO GENERATE PRODUCT ID (PROD-001) ================= */
productSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    try {
      if (mongoose.connection.readyState === 1) {
        const Model = this.constructor || mongoose.models.Product || mongoose.model("Product");
        const products = await Model.find({ id: /^PROD-\d+$/ })
          .select("id")
          .lean()
          .maxTimeMS(5000);

        let maxNum = 0;
        for (const p of products) {
          const match = p.id?.match(/^PROD-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }

        const nextNum = maxNum + 1;
        const padLength = Math.max(3, String(nextNum).length);
        this.id = `PROD-${String(nextNum).padStart(padLength, "0")}`;
      } else {
        this.id = `PROD-${Date.now().toString().slice(-3)}`;
      }
    } catch {
      this.id = `PROD-${Date.now().toString().slice(-3)}`;
    }
  }
});

const Product = mongoose.models.Product || mongoose.model("Product", productSchema, "products");

export default Product;
