import mongoose, { Schema, Document, Types } from "mongoose";

export interface TransactionType extends Document {
  wallet_id: Types.ObjectId;
  type:
    | "funding"
    | "ride_payment"
    | "delivery_payment"
    | "driver_payment"
    | "payout";
  amount: number;
  status?: "pending" | "success" | "failed";
  channel: "card" | "transfer" | "cash" | "wallet";
  ride_id?: Types.ObjectId;
  delivery_id?: Types.ObjectId;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<TransactionType>(
  {
    type: {
      type: String,
      enum: [
        "funding",
        "ride_payment",
        "delivery_payment",
        "driver_payment",
        "payout",
      ],
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
        return this.type === "ride_payment";
      },
    },
    delivery_id: {
      type: Schema.Types.ObjectId,
      ref: "Delivery",
      required: function () {
        return this.type === "delivery_payment";
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

const TransactionModel = mongoose.model<TransactionType>(
  "Transaction",
  TransactionSchema
);
export default TransactionModel;

const update_db = async () => {
  try {
    const data = await TransactionModel.updateMany(
      { "metadata.for": "driver_wallet_crediting" },
      { type: "driver_payment" }
    );
    console.log(data.matchedCount);
  } catch (err) {
    console.log(err);
  }
};
// update_db();
