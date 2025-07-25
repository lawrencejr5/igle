import { Request, Response } from "express";
import { Types } from "mongoose";

import Ride from "../models/ride";
import Wallet from "../models/wallet";

import { get_driver_id } from "../utils/get_driver";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import { debit_wallet } from "../utils/wallet";
import { calculate_fare } from "../utils/calc_fare";
import { calculate_commission } from "../utils/calc_commision";
import { complete_ride } from "../utils/complete_ride";

import { io } from "../server";

export const request_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { km, min } = req.query;
    const { pickup, destination } = req.body;

    if (
      !pickup ||
      !pickup.coordinates ||
      !destination ||
      !destination.coordinates
    ) {
      res.status(400).json({ message: "Pickup and destination are required." });
      return;
    }

    if (!km || !min) {
      res.status(400).json({
        msg: "Distance or Duration cannot be empty",
      });
    }

    const fare = calculate_fare(Number(km), Number(min));
    const commission = calculate_commission(fare);
    const driver_earnings = fare - commission;

    const new_ride = await Ride.create({
      rider: user_id,
      pickup,
      destination,
      fare,
      driver_earnings,
      commission,
      status: "pending",
    });

    // Find drivers nearby and emit via Socket.IO
    io.emit("new_ride_request", {
      ride_id: new_ride._id,
      rider_id: user_id,
      pickup,
      destination,
      fare,
    });

    res.status(201).json({
      message: "Ride request created",
      ride: new_ride,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ message: "Failed to create ride request", err: err.message });
  }
};

// Get available rides (status: pending, no driver assigned)
export const get_available_rides = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const rides = await Ride.find({
      status: "pending",
      driver: { $exists: false },
    });
    res.status(200).json({ msg: "success", rowCount: rides.length, rides });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Get available rides (status: pending, no driver assigned)
export const get_ride_data = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ride_id } = req.query;

    const ride = await Ride.findById(ride_id);
    res.status(200).json({ msg: "success", ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_rides = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;

    const ride = await Ride.find({ rider: user_id });
    res.status(200).json({ msg: "success", rowCount: ride.length, ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Accept a ride (assign driver and update status)
export const accept_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ride_id } = req.query;
    const driver_id = await get_driver_id(req.user?.id!);

    const ride = await Ride.findOneAndUpdate(
      { _id: ride_id, status: "pending", driver: { $exists: false } },
      { driver: driver_id, status: "accepted" },
      { new: true }
    );

    if (!ride) {
      res.status(404).json({ msg: "Ride is invalid or not available." });
      return;
    }

    if (!ride.timestamps) {
      ride.timestamps = {};
    }

    ride.timestamps.accepted_at = new Date();
    await ride.save();

    res.status(200).json({ msg: "Ride accepted successfully", ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Ride cancellation by rider or driver
export const cancel_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ride_id } = req.query;
    const { reason, by } = req.body;

    const ride = await Ride.findById(ride_id);
    if (!ride) {
      res.status(404).json({ msg: "Ride not found." });
      return;
    }

    // Prevent cancelling after completion
    if (["completed", "ongoing"].includes(ride.status)) {
      res.status(400).json({
        msg: `You can't cancel a ride that is ${ride.status}.`,
      });
      return;
    }

    // Mark ride as cancelled
    ride.status = "cancelled";
    ride.timestamps = {
      ...ride.timestamps,
      cancelled_at: new Date(),
    };

    ride.cancelled.by = by;
    if (reason) ride.cancelled.reason = reason;

    await ride.save();

    res.status(200).json({ msg: "Ride cancelled successfully.", ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error.", error: err });
  }
};

// Updating status
export const update_ride_status = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ride_id } = req.query;
    const { status } = req.body;

    const driver_id = await get_driver_id(req.user?.id!);

    if (!status) {
      res.status(404).json({ msg: "No status was provided" });
      return;
    }

    const ride = await Ride.findOne({
      _id: ride_id,
      driver: driver_id,
    });

    if (!ride) {
      res.status(404).json({ msg: "Ride is invalid or not available" });
      return;
    }

    if (!ride.timestamps) {
      ride.timestamps = {};
    }

    switch (status) {
      // arrived at destination
      case "arrived":
        if (ride.status !== "accepted") {
          res.status(400).json({
            msg: "Failed to update ride status",
          });
          return;
        }
        ride.timestamps.arrived_at = new Date();
        ride.status = "arrived";
        break;

      // start ride
      case "ongoing":
        if (ride.status !== "arrived") {
          res.status(400).json({
            msg: "Failed to start ride",
          });
          return;
        } else if (ride.payment_status !== "paid") {
          res.status(400).json({
            msg: "This ride cannot start unless payment has been made",
          });
          return;
        }
        ride.timestamps.started_at = new Date();
        ride.status = "ongoing";
        break;

      // end ride
      case "completed":
        if (ride.status !== "ongoing") {
          res.status(400).json({ msg: "Failed to complete this ride" });
          return;
        }

        const result = await complete_ride(ride);
        if (!result.success) {
          res.status(result.statusCode!).json({ msg: result.message });
          return;
        }
        break;

      // If status is not arrived, ongoing or completed
      default:
        res.status(400).json({ msg: "Invalid status update." });
        return;
    }

    await ride.save();

    res.status(200).json({ msg: "Ride status updated successfully", ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const pay_for_ride = async (req: Request, res: Response) => {
  try {
    const { ride_id } = req.query;
    const user_id = req.user?.id;

    const ride = await Ride.findById(ride_id);
    if (!ride || ride.status !== "arrived") {
      return res.status(400).json({ msg: "Invalid ride or status" });
    }

    const wallet = await Wallet.findOne({ owner_id: user_id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const transaction = await debit_wallet({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount: ride.fare,
      type: "payment",
      channel: "wallet",
      ride_id: new Types.ObjectId(ride._id as string),
      reference: generate_unique_reference(),
      metadata: { for: "ride_payment" },
    });

    // Updating ride status
    ride.status = "ongoing";
    ride.payment_status = "paid";
    ride.payment_method = "wallet";
    await ride.save();

    res.status(200).json({ msg: "Payment successful", transaction });
  } catch (err: any) {
    console.error(err);

    if (err.message === "insufficient") {
      return res.status(400).json({ msg: "Insufficient wallet balance" });
    }
    if (err.message === "no_wallet") {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    res.status(500).json({ msg: "Server error", err });
  }
};
