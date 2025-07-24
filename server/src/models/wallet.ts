import { Schema, model, Types, Document } from "mongoose";

export interface WalletType extends Document {
  owner_id: Types.ObjectId;
  owner_type: "User" | "Driver";
  balance: number;
}

const WalletSchema = new Schema<WalletType>(
  {
    owner_id: {
      type: Schema.Types.ObjectId,
      refPath: "owner_type",
      required: true,
      unique: true,
    },
    owner_type: {
      type: String,
      enum: ["user", "driver"],
    },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<WalletType>("Wallet", WalletSchema);
