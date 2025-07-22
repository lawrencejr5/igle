import mongoose, { Document, Schema } from "mongoose";

export interface DriverType extends Document {
  user: mongoose.Types.ObjectId; // reference to User
  vehicleType: string;
  vehicleNumber: string;
  licensePlate: string;
  driverLicenseImage?: string;
  isOnline: boolean;
  isAvailable: boolean;
  currentLocation: {
    type: string;
    coordinates: [number, number];
  };
  rating?: number;
  totalTrips: number;
}

const DriverSchema = new Schema<DriverType>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  vehicleType: { type: String, required: true },
  vehicleNumber: { type: String, required: true },
  licensePlate: { type: String, required: true },
  driverLicenseImage: { type: String },
  isOnline: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  currentLocation: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0, 0] },
  },
  rating: { type: Number, default: 5 },
  totalTrips: { type: Number, default: 0 },
});

DriverSchema.index({ currentLocation: "2dsphere" });

export default mongoose.model<DriverType>("Driver", DriverSchema);
