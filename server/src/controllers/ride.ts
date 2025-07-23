import { Request, Response } from "express";
import Ride from "../models/ride";

export const request_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id; // from auth middleware
    const { pickup, destination, fare } = req.body;

    if (
      !pickup ||
      !pickup.coordinates ||
      !destination ||
      !destination.coordinates
    ) {
      res.status(400).json({ message: "Pickup and destination are required." });
      return;
    }

    const new_ride = await Ride.create({
      rider: user_id,
      pickup,
      destination,
      fare,
      status: "pending",
    });

    // Later: Find drivers nearby and emit via Socket.IO

    res.status(201).json({
      message: "Ride request created",
      ride: new_ride,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create ride request", error });
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
    const { ride_id, driver_id } = req.query;

    const ride = await Ride.findOneAndUpdate(
      { _id: ride_id, status: "pending", driver: { $exists: false } },
      { driver: driver_id, status: "accepted" },
      { new: true }
    );

    if (!ride) {
      res.status(404).json({ msg: "Ride not found or already accepted." });
      return;
    }

    res.status(200).json({ msg: "Ride accepted successfully", ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};
