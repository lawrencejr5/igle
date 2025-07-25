import { Schema, Types, Document, model } from "mongoose";

export interface CommissionType extends Document {
  ride_id: Types.ObjectId;
  amount: number;
  credited: boolean;
}

// models/Commission.ts
const CommissionSchema = new Schema<CommissionType>(
  {
    ride_id: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    amount: { type: Number, required: true },
    credited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<CommissionType>("Commission", CommissionSchema);
