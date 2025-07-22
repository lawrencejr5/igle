// models/User.ts
import mongoose, { Document, Schema } from "mongoose";

export interface UserType extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  phoneNumber?: string;
  provider: "email" | "google";
  isDriver: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserType>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional if Google user
    googleId: { type: String, unique: true, sparse: true }, // only Google users
    avatar: { type: String },
    phoneNumber: { type: String },
    provider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    isDriver: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });

export default mongoose.model<UserType>("User", UserSchema);
