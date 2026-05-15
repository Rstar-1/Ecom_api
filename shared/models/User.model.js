import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/* ================= ADDRESS ================= */
const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

/* ================= SHOP DETAILS ================= */
const shopDetailsSchema = new mongoose.Schema(
  {
    shopName: { type: String, trim: true },
    businessType: { type: String, trim: true },
    category: { type: String, trim: true },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9A-Z]{15}$/, "Invalid GST number"],
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number"],
    },
    shopLicenseNumber: { type: String, trim: true },
  },
  { _id: false }
);

/* ================= DOCUMENTS ================= */
const documentsSchema = new mongoose.Schema(
  {
    gstCertificate: String,
    panCard: String,
    shopPhoto: String,
  },
  { _id: false }
);

/* ================= USER ================= */
const userSchema = new mongoose.Schema(
  {
    fullname: { type: String, required: true, trim: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      select: false,
      minlength: 6,
    },

    isOtpVerified: { type: Boolean, default: false },

    image: { type: String, default: "" },
    address: { type: [addressSchema], default: [] },

    shopDetails: { type: shopDetailsSchema, default: null },
    documents: { type: documentsSchema, default: null },

    role: { type: String, default: "user" },

    status: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },

    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

/* ================= PASSWORD HASH ================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

/* ================= SAFE RESPONSE ================= */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();

  delete obj.password;

  if (!obj.shopDetails) obj.shopDetails = {};
  if (!obj.documents) obj.documents = {};

  return obj;
};

export default mongoose.model("User", userSchema);