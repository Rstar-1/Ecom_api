import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    rolename: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    permissions: {
      type: [String],
      default: [],
    },

    pages: {
      type: [String],
      default: [],
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
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

/* ================= AUTO GENERATE ROLE ID ================= */
roleSchema.pre("validate", async function () {
  if (!this.id || !this.id.trim()) {
    const Model = this.constructor || mongoose.models.Role || mongoose.model("Role");
    const roles = await Model.find({ id: /^ROLE-\d+$/ }).select("id").lean();

    let maxNum = 0;
    for (const r of roles) {
      const match = r.id?.match(/^ROLE-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    const padLength = Math.max(3, String(nextNum).length);
    this.id = `ROLE-${String(nextNum).padStart(padLength, "0")}`;
  }
});

const Role = mongoose.model("Role", roleSchema);

export default Role;
