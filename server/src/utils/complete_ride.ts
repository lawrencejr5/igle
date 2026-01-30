import mongoose, { Mongoose, Types } from "mongoose";

import Wallet from "../models/wallet";
import AppWallet from "../models/app_wallet";
import Commission from "../models/commission";
import Transaction from "../models/transaction";
import Driver from "../models/driver";
import Ride from "../models/ride";

import { credit_wallet } from "../utils/wallet";

import { generate_unique_reference } from "../utils/gen_unique_ref";

import { RideType } from "../models/ride";
import { incrementUserTasksProgress } from "./task_progress";
import Activity from "../models/activity";
import { sendNotification } from "./expo_push";

export const complete_ride = async (ride: RideType) => {
  const session = await mongoose.startSession();

  try {
    const result = await session.withTransaction(async () => {
      const currentRide = await Ride.findById(ride._id);
      if (!currentRide) throw new Error("Ride not found");

      // Idempotency check
      if (ride.status === "completed") return { success: true };

      if (ride.status !== "ongoing") throw new Error("Ride is not ongoing");

      const wallet = await Wallet.findOne({ owner_id: ride.driver });
      if (!wallet) throw new Error("wallet not found");

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

      // Credit driver wallet
      await credit_wallet(reference, session);

      // Update driver's status as not busy
      await Driver.findByIdAndUpdate(ride.driver, { is_busy: false });

      // Fund app wallet with commission
      const fund_app_wallet = await AppWallet.findOneAndUpdate(
        {},
        { $inc: { balance: Number(ride.commission) } },
        { new: true },
      );
      if (!fund_app_wallet) throw new Error("Funding app wallet failed");

      // Create record of commission
      const commision_record = await Commission.create({
        ride_id: new Types.ObjectId(ride._id as string),
        amount: Number(ride.commission),
        credited: true,
      });
      if (!commision_record) throw new Error("Recording commission failed");

      // Increment driver number of rides
      const driver = await Driver.findById(ride.driver);
      if (driver) {
        driver.total_trips += 1;
        await driver.save();
      }

      // Update ride status and timestamp
      ride.timestamps.completed_at = new Date();
      ride.status = "completed";
      ride.driver_paid = true;
      await ride.save();

      return { success: true };
    });

    await Activity.create({
      type: "ride",
      user: ride.rider,
      title: "Ride completed",
      message: `Your ride to ${ride.destination.address} has been completed`,
      metadata: { ride_id: ride._id, driver_id: ride.driver },
    });

    // Send notification regardless of socket connection
    await sendNotification(
      [String(ride.rider)],
      "Ride completed",
      `Your ride to ${ride.destination.address} has been completed`,
      {
        type: "ride_completed",
        ride_id: ride._id,
      },
    );

    try {
      if (ride.rider) {
        await incrementUserTasksProgress(ride.rider, "ride");
      }
    } catch (err) {
      console.error("Failed to increment rider task progress:", err);
    }

    return { success: result.success };
  } catch (err: any) {
    return {
      success: false,
      statusCode: 500,
      message: err.message,
    };
  } finally {
    session.endSession();
  }
};
