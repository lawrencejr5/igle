import mongoose, { Document, Schema } from "mongoose";

export interface DriverType extends Document {
  user: mongoose.Types.ObjectId;
  profile_img: string;
  socket_id: string;
  vehicle_type: "bike" | "keke" | "cab" | "suv" | "van" | "truck";
  vehicle: {
    exterior_image: string;
    interior_image: string;
    brand: string;
    model: string;
    color: string;
    year: string;
    plate_number: string;
  };
  driver_licence: {
    number: string;
    expiry_date: string;
    front_image: string;
    back_image: string;
    selfie_with_licence: string;
  };
  date_of_birth: string;
  is_online: boolean;
  is_available: boolean;
  is_busy: boolean;
  current_location: {
    type: string;
    coordinates: [number, number];
  };
  bank: {
    bank_name: string;
    account_number: string;
    account_name: string;
    bank_code: string;
    recipient_code: string;
  };
  rating?: number;
  total_trips: number;
  num_of_reviews: number;
  application: "pending" | "rejected" | "submitted" | "approved";

  // optional admin fields
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: mongoose.Types.ObjectId;
  is_blocked?: boolean;
  blocked_at?: Date;
  blocked_by?: mongoose.Types.ObjectId;
}

const DriverSchema = new Schema<DriverType>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    profile_img: String,
    socket_id: { type: String, default: null },
    vehicle_type: {
      type: String,
      enum: ["bike", "keke", "cab", "suv", "van", "truck"],
      required: true,
    },
    vehicle: {
      exterior_image: { type: String },
      interior_image: { type: String },
      brand: { type: String },
      model: { type: String },
      color: { type: String },
      year: { type: String },
      plate_number: { type: String },
    },
    driver_licence: {
      number: { type: String },
      expiry_date: { type: String },
      front_image: { type: String },
      back_image: { type: String },
      selfie_with_licence: { type: String },
    },
    bank: {
      bank_name: String,
      account_number: String,
      account_name: String,
      bank_code: String,
      recipient_code: String,
    },
    date_of_birth: { type: String },
    is_online: { type: Boolean, default: false },
    is_available: { type: Boolean, default: true },
    is_busy: { type: Boolean, default: false },
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
    rating: { type: Number, default: 5 },
    total_trips: { type: Number, default: 0 },
    num_of_reviews: { type: Number, default: 0 },
    application: {
      type: String,
      enum: ["pending", "submitted", "rejected", "approved"],
      default: "pending",
    },

    // admin fields for soft-delete and blocking
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: undefined },
    deleted_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: undefined,
    },
    is_blocked: { type: Boolean, default: false },
    blocked_at: { type: Date, default: undefined },
    blocked_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      default: undefined,
    },
  },
  { timestamps: true }
);

DriverSchema.index({ current_location: "2dsphere" });

export default mongoose.model<DriverType>("Driver", DriverSchema);
