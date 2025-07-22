// models/User.ts
import mongoose, { Document, Schema } from "mongoose";

export interface UserType extends Document {
  name: string;
  email: string;
  password?: string;
  google_id?: string;
  avatar?: string;
  phone?: string;
  provider: "email" | "google";
  is_driver: boolean;
  is_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserType>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional if Google user
    google_id: { type: String, unique: true, sparse: true }, // only Google users
    avatar: { type: String },
    phone: { type: String },
    provider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    is_driver: { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });

export default mongoose.model<UserType>("User", UserSchema);
