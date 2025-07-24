import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import { Types } from "mongoose";

interface WalletInput {
  wallet_id: Types.ObjectId;
  amount: number;
  type: "funding" | "payment" | "payout";
  channel: "card" | "transfer" | "cash" | "wallet";
  ride_id?: Types.ObjectId;
  reference?: string;
  metadata?: Record<string, any>;
}

export const credit_wallet = async ({
  wallet_id,
  amount,
  channel,
  ride_id,
  reference,
  metadata,
}: WalletInput) => {
  const wallet = await Wallet.findById(wallet_id);
  if (!wallet) throw new Error("Wallet not found");

  wallet.balance += amount;
  await wallet.save();

  await Transaction.create({
    wallet_id,
    type: "funding",
    amount,
    status: "success",
    channel,
    ride_id,
    reference,
    metadata,
  });

  return wallet;
};

export const debit_wallet = async ({
  wallet_id,
  ride_id,
  amount,
  reference,
  metadata,
}: WalletInput) => {
  const wallet = await Wallet.findById(wallet_id);
  if (!wallet) throw new Error("no_wallet");

  if (wallet.balance < amount) throw new Error("insufficient");

  wallet.balance -= amount;
  await wallet.save();

  await Transaction.create({
    wallet_id,
    type: "payment",
    amount,
    status: "success",
    channel: "wallet",
    ride_id,
    reference,
    metadata,
  });

  return wallet;
};
