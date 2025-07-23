import { Request, Response } from "express";
import Ride from "../models/ride";

export const request_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id; // from auth middleware
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

    const new_ride = await Ride.create({
      rider: user_id,
      pickup,
      destination,
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
