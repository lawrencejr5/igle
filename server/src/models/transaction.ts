import mongoose, { Schema, Document, Types } from "mongoose";

export interface TransactionType extends Document {
  wallet_id: Types.ObjectId;
  type: "funding" | "payment" | "payout";
  amount: number;
  status?: "pending" | "success" | "failed";
  channel: "card" | "transfer" | "cash" | "wallet";
  ride_id?: Types.ObjectId;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<TransactionType>(
  {
    type: {
      type: String,
      enum: ["funding", "payment", "payout"],
      required: true,
    },

    wallet_id: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },

    ride_id: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: function () {
        return this.type === "payment";
      },
    },

    amount: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    channel: {
      type: String,
      enum: ["card", "transfer", "cash", "wallet"],
      required: true,
    },

    reference: { type: String, unique: true },

    metadata: { type: Schema.Types.Mixed }, // any extra info (e.g., driver id, transfer details)
  },
  { timestamps: true }
);

export default mongoose.model<TransactionType>(
  "Transaction",
  TransactionSchema
);
