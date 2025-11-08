// models/User.ts
import mongoose, { Document, Schema } from "mongoose";

export interface UserType extends Document {
  name: string;
  email: string;
  password?: string;
  profile_pic?: string | null;
  profile_pic_public_id?: string | null;
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
  driver_application: "none" | "rejected" | "submitted" | "approved";
  is_driver: boolean;
  is_verified: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: any;
  is_blocked?: boolean;
  blocked_at?: Date;
  blocked_by?: any;
  expo_push_tokens?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserType>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // optional if Google user
    profile_pic: { type: String },
    profile_pic_public_id: { type: String },
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
    driver_application: {
      type: String,
      enum: ["none", "submitted", "rejected", "approved"],
      default: "none",
    },
    is_driver: { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
    // soft delete fields
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    // block fields
    is_blocked: { type: Boolean, default: false },
    blocked_at: { type: Date, default: null },
    blocked_by: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    // Expo push tokens (multiple devices per user)
    expo_push_tokens: { type: [String], default: [] },
  },
  { timestamps: true }
);

UserSchema.index({ location: "2dsphere" });

export default mongoose.model<UserType>("User", UserSchema);
