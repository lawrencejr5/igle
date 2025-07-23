import mongoose, { Document, Schema } from "mongoose";

export interface DriverType extends Document {
  user: mongoose.Types.ObjectId;
  vehicle_type: string;
  vehicle_number: string;
  license_plate: string;
  driver_license_image?: string;
  is_online: boolean;
  is_available: boolean;
  current_location: {
    type: string;
    coordinates: [number, number];
  };
  rating?: number;
  total_trips: number;
}

const DriverSchema = new Schema<DriverType>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  vehicle_type: { type: String, required: true },
  vehicle_number: { type: String, required: true },
  license_plate: { type: String, required: true },
  driver_license_image: { type: String },
  is_online: { type: Boolean, default: false },
  is_available: { type: Boolean, default: true },
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
});

DriverSchema.index({ current_location: "2dsphere" });

export default mongoose.model<DriverType>("Driver", DriverSchema);
