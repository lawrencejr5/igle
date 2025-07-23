import mongoose, { Schema, Document } from "mongoose";

export interface RideType extends Document {
  rider: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  destination: {
    address: string;
    coordinates: [number, number];
  };
  status:
    | "pending"
    | "accepted"
    | "arrived"
    | "ongoing"
    | "completed"
    | "cancelled";
  fare: number;
  timestamps: {
    accepted_at?: Date;
    arrived_at?: Date;
    started_at?: Date;
    completed_at?: Date;
    cancelled_at?: Date;
  };
  cancelled: {
    by?: "rider" | "driver";
    reason?: string;
  };
  payment_status: "unpaid" | "paid";
  payment_method: "cash" | "card";
  commission: number;
}

const RideSchema = new Schema<RideType>(
  {
    rider: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "User" },
    pickup: {
      address: String,
      coordinates: [Number],
    },
    destination: {
      address: String,
      coordinates: [Number],
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "arrived",
        "ongoing",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    fare: { type: Number, required: true },
    timestamps: {
      accepted_at: Date,
      arrived_at: Date,
      started_at: Date,
      completed_at: Date,
      cancelled_at: Date,
    },
    cancelled: {
      by: {
        type: String,
        enum: ["rider", "driver"],
      },
      reason: String,
    },
    payment_status: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
    },
    payment_method: { type: String, enum: ["cash", "card"], default: "cash" },
    commission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<RideType>("Ride", RideSchema);
