// models/Commission.ts
import mongoose, { Document, Schema } from "mongoose";

export interface CommissionType extends Document {
  tripId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  totalFare: number;
  platformShare: number;
  driverShare: number;
  paymentMethod: "card" | "wallet" | "cash";
  status: "pending" | "paid";
  createdAt: Date;
}

const CommissionSchema = new Schema<CommissionType>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    totalFare: { type: Number, required: true },
    platformShare: { type: Number, required: true },
    driverShare: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["card", "wallet", "cash"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model<CommissionType>("Commission", CommissionSchema);
