import { Schema, Types, Document, model } from "mongoose";

export interface CommissionType extends Document {
  ride_id: Types.ObjectId;
  driver_id: Types.ObjectId;
  amount: number;
  paid: boolean;
}

// models/Commission.ts
const CommissionSchema = new Schema<CommissionType>(
  {
    ride_id: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    driver_id: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    amount: { type: Number, required: true },
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<CommissionType>("Commission", CommissionSchema);
