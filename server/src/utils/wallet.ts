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

export const credit_wallet = async (
  reference: string,
  ext_session?: mongoose.ClientSession,
) => {
  // Determine if we are managing the session or borrowing it
  const isLocalSession = !ext_session;
  const session = ext_session || (await mongoose.startSession());

  try {
    // Define the core DB work (so we don't duplicate code)
    const executeLogic = async () => {
      const transaction = await Transaction.findOne({ reference }).session(
        session,
      );

      if (!transaction) throw new Error("Transaction was not found");

      // Idempotency check
      if (transaction.status !== "pending") {
        return { balance: null, transaction, alreadyProcessed: true };
      }

      const wallet = await Wallet.findById(transaction.wallet_id).session(
        session,
      );
      if (!wallet) throw new Error("Wallet not found");

      const amount = transaction.amount!;

      // Update Balance
      wallet.balance += amount;
      await wallet.save({ session });

      // Update Transaction
      transaction.status = "success";
      await transaction.save({ session });

      return { balance: wallet.balance, transaction, alreadyProcessed: false };
    };

    let result;
    if (isLocalSession) {
      result = await session.withTransaction(executeLogic);
    } else {
      result = await executeLogic();
    }

    if (isLocalSession && result && !result.alreadyProcessed) {
      await notifyUserOfCredit(result.transaction);
    }

    return result;
  } catch (err) {
    console.log("Credit wallet transaction failed: " + err);
    throw err;
  } finally {
    if (isLocalSession) {
      session.endSession();
    }
  }
};

// Extracted helper to keep the main function clean
const notifyUserOfCredit = async (transaction: any) => {
  try {
    const wallet = await Wallet.findById(transaction.wallet_id).select(
      "owner_id owner_type",
    );
    if (!wallet) return;

    await ActivityModel.create({
      type: "wallet_funding",
      user: wallet.owner_id,
      title: "Wallet funded",
      message: `Your wallet was credited with NGN ${transaction.amount}`,
      metadata: { owner_id: wallet.owner_id },
    });

    await sendNotification(
      [wallet.owner_id.toString()],
      "Wallet funded",
      `Your wallet was credited with ${transaction.amount}`,
      {
        type: "wallet_funded",
        reference: transaction.reference,
      },
    );
  } catch (e) {
    console.error("Failed to send wallet credit notification:", e);
  }
};

export const debit_wallet = async (
  {
    wallet_id,
    ride_id,
    delivery_id,
    type,
    amount,
    reference,
    status = "success",
    metadata,
  }: WalletInput,
  ext_session?: mongoose.ClientSession,
) => {
  //  Determine ownership
  const isLocalSession = !ext_session;
  const session = ext_session || (await mongoose.startSession());

  try {
    // Define the logic
    const executeLogic = async () => {
      // Pass session to the query
      const idem_check = await Transaction.findOne({ reference }).session(
        session,
      );

      if (idem_check && idem_check.status === "success") {
        return {
          balance: null,
          transaction: idem_check,
          already_processed: true,
        };
      }

      // Pass session to the query
      const wallet = await Wallet.findById(wallet_id).session(session);
      if (!wallet) throw new Error("no_wallet");

      if (wallet.balance < amount) throw new Error("insufficient");

      // Update wallet balance
      wallet.balance -= amount;
      await wallet.save({ session });

      // Create Transaction Record
      const [transaction] = await Transaction.create(
        [
          {
            wallet_id,
            type,
            amount,
            status,
            channel: "wallet",
            ride_id: ride_id && ride_id,
            delivery_id: delivery_id && delivery_id,
            reference,
            metadata,
          },
        ],
        { session },
      );

      return { balance: wallet.balance, transaction, already_processed: false };
    };

    // 4. Run based on ownership
    let result;
    if (isLocalSession) {
      // Standalone: We wrap it in a transaction
      result = await session.withTransaction(executeLogic);
    } else {
      // Nested: We just run the logic (Parent handles commit/abort)
      result = await executeLogic();
    }

    return result;
  } catch (err) {
    console.log("Debit wallet transaction failed: ", err);
    throw err;
  } finally {
    // 5. Only end session if WE started it
    if (isLocalSession) {
      session.endSession();
    }
  }
};
