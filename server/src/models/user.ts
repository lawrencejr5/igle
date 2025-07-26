// models/User.ts
import mongoose, { Document, Schema } from "mongoose";

export interface UserType extends Document {
  name: string;
  email: string;
  password?: string;
  google_id?: string;
  socket_id?: string;
  is_online?: boolean;
  avatar?: string;
  phone?: string;
  provider: "email" | "google";
  current_location: {
    type: string;
    coordinates: [number, number];
  };
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
    socket_id: { type: String, default: null },
    is_online: { type: Boolean, default: true },
    avatar: { type: String },
    phone: { type: String },
    provider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    current_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    is_driver: { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });

export default mongoose.model<UserType>("User", UserSchema);
