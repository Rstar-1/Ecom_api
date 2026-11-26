import bcrypt from "bcryptjs";
import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../../utils/crud";

const userSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true }, // USER-001
    fullname: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    mobile: { type: String, sparse: true, trim: true },
    password: { type: String, required: true, select: false },
    isOtpVerified: { type: Boolean, default: false },
    image: { type: String, default: "" },
    address: { type: [String], default: ["", ""] },
    social: { type: [Schema.Types.Mixed], default: [] },
    documents: { type: Schema.Types.Mixed, default: null },
    role: { type: String, trim: true, lowercase: true, default: "customer" },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: false },
    loginAttempts: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    versionKey: "__v",
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.password;
        return ret;
      },
    },
  }
);

applySequentialId(userSchema, "USER", "users");

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

export const User = model("User", userSchema);
export type IUser = InferSchemaType<typeof userSchema>;
export type UserDocument = ReturnType<(typeof User)["hydrate"]>;
