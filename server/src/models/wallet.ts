import { Schema, model, Types, Document } from "mongoose";

export interface WalletType extends Document {
  user_id: Types.ObjectId;
  balance: number;
}

const WalletSchema = new Schema<WalletType>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model("Wallet", WalletSchema);
