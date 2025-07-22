import mongoose, { Schema, Document } from "mongoose";

export interface RideType extends Document {
  rider: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  origin: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  status: "pending" | "accepted" | "ongoing" | "completed" | "cancelled";
  fare: number;
  paymentStatus: "unpaid" | "paid";
  paymentMethod: "cash" | "card";
  commission: number;
}

const RideSchema = new Schema<RideType>(
  {
    rider: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    origin: {
      address: String,
      coordinates: [Number],
    },
    destination: {
      address: String,
      coordinates: [Number],
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    fare: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    paymentMethod: { type: String, enum: ["cash", "card"], default: "cash" },
    commission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<RideType>("Ride", RideSchema);
