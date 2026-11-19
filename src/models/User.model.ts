import bcrypt from "bcryptjs";
import { Schema, model, type InferSchemaType } from "mongoose";

/* ================= ADDRESS ================= */
const addressSchema = new Schema(
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
const shopDetailsSchema = new Schema(
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
const documentsSchema = new Schema(
  {
    gstCertificate: String,
    panCard: String,
    shopPhoto: String,
  },
  { _id: false }
);

/* ================= USER ================= */
const userSchema = new Schema(
  {
    fullname: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    mobile: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, select: false, minlength: 6 },
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
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      /* SAFE RESPONSE: never expose the password hash */
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        if (!ret.shopDetails) ret.shopDetails = {};
        if (!ret.documents) ret.documents = {};
        return ret;
      },
    },
  }
);

/* ================= PASSWORD HASH ================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = model("User", userSchema);

export type IUser = InferSchemaType<typeof userSchema>;
export type UserDocument = ReturnType<(typeof User)["hydrate"]>;
export type ShopDetails = NonNullable<IUser["shopDetails"]>;
export type UserDocuments = NonNullable<IUser["documents"]>;
