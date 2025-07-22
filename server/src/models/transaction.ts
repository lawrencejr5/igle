import mongoose, { Schema, Document } from "mongoose";

export interface TransactionType extends Document {
  ride: mongoose.Types.ObjectId;
  rider: mongoose.Types.ObjectId;
  amount: number;
  commission: number;
  method: "cash" | "card";
  status: "success" | "failed";
}

const TransactionSchema = new Schema<TransactionType>(
  {
    ride: { type: Schema.Types.ObjectId, ref: "Ride", required: true },
    rider: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    commission: { type: Number, required: true },
    method: { type: String, enum: ["cash", "card"], default: "cash" },
    status: { type: String, enum: ["success", "failed"], default: "success" },
  },
  { timestamps: true }
);

export default mongoose.model<TransactionType>(
  "Transaction",
  TransactionSchema
);
