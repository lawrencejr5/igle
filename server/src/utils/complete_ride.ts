import { Types } from "mongoose";

import Wallet from "../models/wallet";
import AppWallet from "../models/app_wallet";
import Commission from "../models/commission";
import Transaction from "../models/transaction";

import { credit_wallet } from "../utils/wallet";

import { generate_unique_reference } from "../utils/gen_unique_ref";

import { RideType } from "../models/ride";
import { incrementUserTasksProgress } from "./task_progress";

export const complete_ride = async (ride: RideType) => {
  try {
    const wallet = await Wallet.findOne({ owner_id: ride.driver });
    if (!wallet) {
      return { success: false, statusCode: 404, message: "Wallet not found" };
    }

    const reference = generate_unique_reference();

    await Transaction.create({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount: ride.driver_earnings,
      type: "driver_payment",
      channel: "wallet",
      status: "pending",
      ride_id: new Types.ObjectId(ride._id as string),
      reference,
      metadata: { for: "driver_wallet_crediting", type: "ride" },
    });

    await credit_wallet(reference);

    const fund_app_wallet = await AppWallet.findOneAndUpdate(
      {},
      { $inc: { balance: Number(ride.commission) } },
      { new: true }
    );
    if (!fund_app_wallet) throw new Error("Funding app wallet failed");

    const commision_record = await Commission.create({
      ride_id: new Types.ObjectId(ride._id as string),
      amount: Number(ride.commission),
      credited: true,
    });
    if (!commision_record) throw new Error("Recording commission failed");

    ride.timestamps.completed_at = new Date();
    ride.status = "completed";
    ride.driver_paid = true;
    await ride.save();

    // Update rider task progress for all active 'ride' tasks
    try {
      if (ride.rider) {
        await incrementUserTasksProgress(ride.rider, "ride");
      }
    } catch (progressErr) {
      console.error("Failed to increment rider task progress:", progressErr);
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
