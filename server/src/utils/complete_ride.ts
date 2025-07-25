import { Types } from "mongoose";

import Wallet from "../models/wallet";
import AppWallet from "../models/app_wallet";
import Commission from "../models/commission";
import Transaction from "../models/transaction";

import { credit_wallet } from "../utils/wallet";

import { generate_unique_reference } from "../utils/gen_unique_ref";

import { RideType } from "../models/ride";

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
      type: "payment",
      channel: "wallet",
      status: "pending",
      ride_id: new Types.ObjectId(ride._id as string),
      reference,
      metadata: { for: "driver_wallet_crediting" },
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

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      message: err.message,
    };
  }
};
