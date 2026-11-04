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

const Role = mongoose.model("Role", roleSchema);

export default Role;
