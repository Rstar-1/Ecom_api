import mongoose from "mongoose";

// Specifications Schema
const specificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  },
});

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

// Blog Schema
const blogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BlogCategory",
      required: true,
    },

    blogName: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    shortDesc: {
      type: String,
      default: "",
      trim: true,
    },

    quote: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    readTime: {
      type: String,
      default: "1 min read",
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
blogSchema.virtual("name").get(function () {
  return this.blogName;
}).set(function (val) {
  this.blogName = val;
});

blogSchema.virtual("title").get(function () {
  return this.blogName;
}).set(function (val) {
  this.blogName = val;
});

/* ================= AUTO GENERATE BLOG ID (BLOG-001) ================= */
blogSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    try {
      if (mongoose.connection.readyState === 1) {
        const Model = this.constructor || mongoose.models.Blog || mongoose.model("Blog");
        const blogs = await Model.find({ id: /^BLOG-\d+$/ })
          .select("id")
          .lean()
          .maxTimeMS(5000);

        let maxNum = 0;
        for (const b of blogs) {
          const match = b.id?.match(/^BLOG-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        }

        const nextNum = maxNum + 1;
        const padLength = Math.max(3, String(nextNum).length);
        this.id = `BLOG-${String(nextNum).padStart(padLength, "0")}`;
      } else {
        this.id = `BLOG-${Date.now().toString().slice(-3)}`;
      }
    } catch {
      this.id = `BLOG-${Date.now().toString().slice(-3)}`;
    }
  }
});

const Blog = mongoose.models.Blog || mongoose.model("Blog", blogSchema, "blogs");

export default Blog;
