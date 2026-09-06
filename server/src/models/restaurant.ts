import mongoose, { Document, Schema } from "mongoose";

export interface RestaurantType extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  logo?: string;
  banner?: string;
  category_tags: string[];
  phone: string;
  email: string;
  description?: string;
  operating_hours: {
    day: string; // "Mon", "Tue", etc.
    open: string; // "08:00 AM"
    close: string; // "10:00 PM"
    closed: boolean;
  }[];
  location: {
    address: string;
    landmark?: string;
    coordinates: {
      type: "Point";
      coordinates: [number, number]; // [longitude, latitude]
    };
    delivery_radius_km: number;
  };
  bank?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    bank_code: string;
    recipient_code?: string;
  };
  verification: {
    government_id: string;
    cac_document?: string;
    is_cac_verified: boolean;
  };
  is_online: boolean;
  is_verified: boolean;
  application: "none" | "pending" | "rejected" | "submitted" | "approved";
  rating?: number;
  num_of_reviews?: number;

  // Admin management fields
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: mongoose.Types.ObjectId;
  is_blocked?: boolean;
  blocked_at?: Date;
  blocked_by?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<RestaurantType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    category_tags: { type: [String], default: [] },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String, default: "" },
    operating_hours: [
      {
        day: { type: String, required: true },
        open: { type: String, default: "08:00 AM" },
        close: { type: String, default: "10:00 PM" },
        closed: { type: Boolean, default: false },
      },
    ],
    location: {
      address: { type: String, required: true },
      landmark: { type: String, default: "" },
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
          default: [3.3792, 6.5244],
        },
      },
      delivery_radius_km: { type: Number, default: 5 },
    },
    bank: {
      bank_name: { type: String, default: "" },
      account_number: { type: String, default: "" },
      account_name: { type: String, default: "" },
      bank_code: { type: String, default: "" },
      recipient_code: { type: String, default: "" },
    },
    verification: {
      government_id: { type: String, default: "" },
      cac_document: { type: String, default: "" },
      is_cac_verified: { type: Boolean, default: false },
    },
    is_online: { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
    application: {
      type: String,
      enum: ["none", "pending", "rejected", "submitted", "approved"],
      default: "submitted",
    },
    rating: { type: Number, default: 5.0 },
    num_of_reviews: { type: Number, default: 0 },

    // Soft delete & block
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
    is_blocked: { type: Boolean, default: false },
    blocked_at: { type: Date, default: null },
    blocked_by: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

RestaurantSchema.index({ "location.coordinates": "2dsphere" });

export default mongoose.model<RestaurantType>("Restaurant", RestaurantSchema);
