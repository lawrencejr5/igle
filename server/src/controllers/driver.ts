import { Request, Response } from "express";

import Driver from "../models/driver";
import Wallet from "../models/wallet";

// Create a new driver
export const create_driver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      vehicle_type,
      vehicle_number,
      license_plate,
      driver_license_image,
      coordinates,
    } = req.body;
    const user = req.user?.id;

    const existing_driver = await Driver.findOne({ user });
    if (existing_driver) {
      res.status(409).json({ msg: "Driver already exists for this user." });
      return;
    }

    const driver = await Driver.create({
      user,
      vehicle_type,
      vehicle_number,
      license_plate,
      driver_license_image,
      "current_location.coordinates": coordinates,
    });

    await Wallet.create({ owner_id: driver?._id, owner_type: "Driver" });

    res.status(201).json({ msg: "Driver created successfully", driver });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Update driver's current location
export const update_location = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { coordinates } = req.body; // [longitude, latitude]

    const driver = await Driver.findByIdAndUpdate(
      id,
      { "current_location.coordinates": coordinates },
      { new: true }
    );

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver location updated successfully",
      driver_id: id,
      new_coordinates: driver?.current_location?.coordinates,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Get driver info
export const get_driver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const driver = await Driver.findById(id).populate("user");

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({ msg: "success", driver });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};
