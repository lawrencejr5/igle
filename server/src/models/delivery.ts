import mongoose, { Schema, Document } from "mongoose";

export interface DeliveryType extends Document {
  sender: mongoose.Types.ObjectId;
  driver?: mongoose.Types.ObjectId;
  pickup: {
    address: string;
    coordinates: [number, number];
  };
  dropoff: {
    address: string;
    coordinates: [number, number];
  };
  to?: {
    name?: string;
    phone?: string;
  };
  package: {
    description?: string;
    fragile?: boolean;
    amount?: number;
    type?:
      | "document"
      | "electronics"
      | "clothing"
      | "food"
      | "furniture"
      | "other";
  };
  status:
    | "pending"
    | "scheduled"
    | "accepted"
    | "arrived"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "failed"
    | "cancelled"
    | "expired";
  fare: number;
  vehicle: "bike" | "cab" | "van" | "truck";
  payment_status: "unpaid" | "paid";
  payment_method: "cash" | "card" | "wallet";
  timestamps: {
    accepted_at?: Date;
    picked_up_at?: Date;
    delivered_at?: Date;
    cancelled_at?: Date;
  };
  cancelled?: { by?: "sender" | "driver"; reason?: string };
  driver_earnings: number;
  commission: number;
  scheduled: boolean;
  scheduled_time?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema<DeliveryType>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "Driver" },
    pickup: {
      address: String,
      coordinates: [Number],
    },
    dropoff: {
      address: String,
      coordinates: [Number],
    },
    to: {
      name: String,
      phone: String,
    },
    package: {
      description: String,
      fragile: { type: Boolean, default: false },
      amount: Number,
      type: {
        type: String,
        enum: [
          "document",
          "electronics",
          "clothing",
          "food",
          "furniture",
          "other",
        ],
        default: "other",
      },
    },
    status: {
      type: String,
      enum: [
        "pending",
        "scheduled",
        "accepted",
        "arrived",
        "picked_up",
        "in_transit",
        "delivered",
        "failed",
        "cancelled",
        "expired",
      ],
      default: "pending",
    },
    fare: { type: Number, required: true },
    vehicle: {
      type: String,
      enum: ["bike", "cab", "van", "truck"],
      required: true,
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
    timestamps: {
      accepted_at: Date,
      picked_up_at: Date,
      delivered_at: Date,
      cancelled_at: Date,
    },
    cancelled: {
      by: { type: String, enum: ["sender", "driver"] },
      reason: String,
    },
    driver_earnings: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    scheduled: { type: Boolean, default: false },
    scheduled_time: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<DeliveryType>("Delivery", DeliverySchema);
