import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  { _id: false }
);

const loginSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
    },

    mobileno: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Mobile number must be 10 digits"],
    },

    password: {
      type: String,
      required: true,
      select: false,
      minlength: 6,
    },

    image: {
      type: String,
      default: "",
    },

    address: {
      type: [addressSchema],
      default: [],
    },

    role: {
      type: String,
      enum: ["user", "marketing", "vendor", "admin"],
      default: "user",
      index: true,
    },

    status: {
      type: Boolean,
      default: true,
      index: true,
    },

    lastLogin: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 🔥 TEXT INDEX
loginSchema.index({ fullname: "text", email: "text", mobileno: "text" });

// 🔥 AUTO HASH PASSWORD
loginSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔥 REMOVE PASSWORD IN RESPONSE
loginSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ✅ EXPORT
const Auth = mongoose.model("auth", loginSchema);
export default Auth;