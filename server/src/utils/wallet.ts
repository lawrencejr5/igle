import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import { Types } from "mongoose";

interface WalletInput {
  wallet_id: Types.ObjectId;
  amount: number;
  type: "funding" | "ride_payment" | "delivery_payment" | "payout";
  channel: "card" | "transfer" | "cash" | "wallet";
  ride_id?: Types.ObjectId;
  delivery_id?: Types.ObjectId;
  reference?: string;
  status?: "pending" | "success" | "failed";
  metadata?: Record<string, any>;
}

export const credit_wallet = async (reference: string) => {
  const transaction = await Transaction.findOne({ reference });
  if (!transaction) throw new Error("Transaction was not found");
  if (transaction.status !== "pending")
    throw new Error("This transaction has already been processed");

  const wallet_id = transaction?.wallet_id;
  const wallet = await Wallet.findById(wallet_id);
  if (!wallet) throw new Error("Wallet not found");

  const amount = transaction?.amount!;

  wallet.balance += amount;
  await wallet.save();

  transaction.status = "success";
  await transaction.save();

  return { balance: wallet.balance, transaction };
};

export const debit_wallet = async ({
  wallet_id,
  ride_id,
  delivery_id,
  type,
  amount,
  reference,
  status = "success",
  metadata,
}: WalletInput) => {
  const wallet = await Wallet.findById(wallet_id);
  if (!wallet) throw new Error("no_wallet");

  if (wallet.balance < amount) throw new Error("insufficient");

  wallet.balance -= amount;
  await wallet.save();

  const transaction = await Transaction.create({
    wallet_id,
    type,
    amount,
    status,
    channel: "wallet",
    ride_id: ride_id && ride_id,
    delivery_id: delivery_id && delivery_id,
    reference,
    metadata,
  });

  return { balance: wallet.balance, transaction };
};
