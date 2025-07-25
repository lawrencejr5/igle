import { Types } from "mongoose";

import Wallet from "../models/wallet";

import { credit_wallet } from "../utils/wallet";

import { generate_unique_reference } from "../utils/gen_unique_ref";

import { RideType } from "../models/ride";

export const complete_ride = async (ride: RideType) => {
  try {
    const wallet = await Wallet.findOne({ owner_id: ride.driver });
    if (!wallet) {
      return { success: false, statusCode: 404, message: "Wallet not found" };
    }

    await credit_wallet({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount: ride.driver_earnings,
      type: "payment",
      channel: "wallet",
      ride_id: new Types.ObjectId(ride._id as string),
      reference: generate_unique_reference(),
      metadata: { for: "driver_payment" },
    });

    ride.timestamps.completed_at = new Date();
    ride.status = "completed";
    ride.driver_paid = true;
    await ride.save();

    return { success: true };
  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      message: "Ride completion failed",
    };
  }
};
