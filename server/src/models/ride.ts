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
  driver_location?: [number, number];
  status:
    | "pending"
    | "scheduled"
    | "accepted"
    | "arrived"
    | "ongoing"
    | "completed"
    | "cancelled"
    | "expired";
  fare: number;
  distance_km: number;
  duration_mins: number;
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
  payment_method: "cash" | "card" | "wallet";
  driver_earnings: number;
  driver_paid: boolean;
  commission: number;
  scheduled_time: Date | null;
}

const RideSchema = new Schema<RideType>(
  {
    rider: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "Driver" },
    pickup: {
      address: String,
      coordinates: [Number],
    },
    destination: {
      address: String,
      coordinates: [Number],
    },
    driver_location: [Number, Number],
    status: {
      type: String,
      enum: [
        "pending",
        "scheduled",
        "accepted",
        "arrived",
        "ongoing",
        "completed",
        "cancelled",
        "expired",
      ],
      default: "pending",
    },
    fare: { type: Number, required: true },
    distance_km: { type: Number, required: true },
    duration_mins: { type: Number, required: true },
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
    payment_method: {
      type: String,
      enum: ["cash", "card", "wallet"],
      default: "cash",
    },
    driver_earnings: { type: Number, required: true },
    driver_paid: { type: Boolean, default: false },
    commission: { type: Number, default: 0 },
    scheduled_time: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<RideType>("Ride", RideSchema);
