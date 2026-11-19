import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    vendorId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    image: String,
    price: Number,
    quantity: { type: Number, default: 1 },
    variant: {
      size: String,
      color: String,
    },
  },
  { _id: false }
);

const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
    totalItems: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export type ICart = InferSchemaType<typeof cartSchema>;

export interface CartItemInput {
  productId: string | Types.ObjectId;
  vendorId?: string | Types.ObjectId;
  name?: string;
  image?: string;
  price: number;
  quantity: number;
  variant?: { size?: string; color?: string };
}

export const Cart = model("Cart", cartSchema);
