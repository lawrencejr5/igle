import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import mongoose, { Types } from "mongoose";
import { get_user_push_tokens } from "./get_id";
import ActivityModel from "../models/activity";
import { sendNotification } from "./expo_push";

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
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const transaction = await Transaction.findOne({ reference });
      if (!transaction) throw new Error("Transaction was not found");
      if (transaction.status !== "pending") {
        return { balance: null, transaction, alreadyProcessed: true };
      }

      const wallet_id = transaction?.wallet_id;
      const wallet = await Wallet.findById(wallet_id);
      if (!wallet) throw new Error("Wallet not found");

      const amount = transaction?.amount!;

      wallet.balance += amount;
      await wallet.save();

      transaction.status = "success";
      await transaction.save();

      return { balance: wallet.balance, transaction };
    });

    if (result && !result.alreadyProcessed) {
      const transaction = result.transaction;

      // Look up the user's push tokens using the wallet_id from the transaction
      const walletId = transaction?.wallet_id;
      if (walletId) {
        const wallet = await Wallet.findById(walletId).select(
          "owner_id owner_type",
        );
        if (wallet) {
          const ownerId = wallet.owner_id;
          let tokens: string[] = [];
          tokens = await get_user_push_tokens(ownerId as any);

          await ActivityModel.create({
            type: "wallet_funding",
            user: wallet.owner_id,
            title: "Wallet funded",
            message: `Your wallet was creditted with NGN ${transaction.amount}`,
            metadata: { owner_id: ownerId },
          });

          if (tokens.length) {
            await sendNotification(
              [wallet.owner_id.toString()],
              "Wallet funded",
              `Your wallet was credited with ${transaction.amount}`,
              {
                type: "wallet_funded",
                reference: transaction.reference,
              },
            );
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.log("Credit wallet tranaction failed: " + err);
    throw err;
  } finally {
    session.endSession();
  }
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
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const idem_check = await Transaction.findOne({ reference });
      if (idem_check && idem_check.status === "success") {
        return {
          balance: null,
          transaction: idem_check,
          already_processed: true,
        };
      }

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
    });
    return result;
  } catch (err) {
    console.log("Debit wallet transaction failed: ", err);
    throw err;
  } finally {
    session.endSession();
  }
};
