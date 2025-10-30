import { Types } from "mongoose";

import Wallet from "../models/wallet";
import AppWallet from "../models/app_wallet";
import Commission from "../models/commission";
import Transaction from "../models/transaction";

import { credit_wallet } from "../utils/wallet";

import { generate_unique_reference } from "../utils/gen_unique_ref";

import { DeliveryType } from "../models/delivery";
import { incrementUserTasksProgress } from "./task_progress";

export const complete_delivery = async (delivery: DeliveryType) => {
  try {
    const wallet = await Wallet.findOne({ owner_id: delivery.driver });
    if (!wallet) {
      return { success: false, statusCode: 404, message: "Wallet not found" };
    }

    const reference = generate_unique_reference();

    await Transaction.create({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount: delivery.driver_earnings,
      type: "payment",
      channel: "wallet",
      status: "pending",
      ride_id: new Types.ObjectId(delivery._id as string),
      reference,
      metadata: { for: "driver_wallet_crediting" },
    });

    await credit_wallet(reference);

    const fund_app_wallet = await AppWallet.findOneAndUpdate(
      {},
      { $inc: { balance: Number(delivery.commission) } },
      { new: true }
    );
    if (!fund_app_wallet) throw new Error("Funding app wallet failed");

    const commision_record = await Commission.create({
      ride_id: new Types.ObjectId(delivery._id as string),
      amount: Number(delivery.commission),
      credited: true,
    });
    if (!commision_record) throw new Error("Recording commission failed");

    delivery.timestamps = delivery.timestamps || ({} as any);
    (delivery.timestamps as any).delivered_at = new Date();
    delivery.status = "delivered" as any;
    // mark driver paid flag if present
    (delivery as any).driver_paid = true;
    await delivery.save();

    // Update sender task progress for all active 'delivery' tasks
    try {
      if (delivery.sender) {
        await incrementUserTasksProgress(delivery.sender, "delivery");
      }
    } catch (progressErr) {
      console.error("Failed to increment sender task progress:", progressErr);
    }

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      message: err.message,
    };
  }
};
