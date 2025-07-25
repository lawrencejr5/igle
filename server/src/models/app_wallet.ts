import { Document, Schema, Types, model } from "mongoose";

interface AppWalletType extends Document {
  balance: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const AppWalletSchema = new Schema<AppWalletType>(
  {
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const AppWallet = model<AppWalletType>("AppWallet", AppWalletSchema);
export default AppWallet;
