import { Request, Response } from "express";

import Driver from "../models/driver";
import Wallet from "../models/wallet";

import { get_driver_id } from "../utils/get_id";

import axios from "axios";

import dotenv from "dotenv";
dotenv.config();

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

    await Wallet.create({
      owner_id: driver?._id,
      owner_type: "Driver",
      balance: 0,
    });

    res.status(201).json({ msg: "Driver created successfully", driver });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const save_bank_info = async (req: any, res: any) => {
  try {
    const { account_name, account_number, bank_code, bank_name } = req.body;

    // Call Paystack to create transfer recipient
    const { data } = await axios.post(
      "https://api.paystack.co/transferrecipient",
      {
        type: "nuban",
        name: account_name,
        account_number,
        bank_code,
        currency: "NGN",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const recipient_code = data.data.recipient_code;

    const driver_id = await get_driver_id(req.user?.id!);
    // Save to driver schema
    await Driver.findByIdAndUpdate(driver_id, {
      bank: {
        account_name,
        account_number,
        bank_code,
        bank_name,
        recipient_code,
      },
    });

    res.json({ msg: "Bank info saved successfully" });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ msg: "Failed to save bank info", err });
  }
};

// Update driver's current location
export const update_location = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const { coordinates } = req.body; // [longitude, latitude]

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      { "current_location.coordinates": coordinates },
      { new: true }
    );

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver location updated successfully",
      driver_id,
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

export const set_driver_availability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;
    if (!status) {
      res.status(404).json({ msg: "Input status" });
      return;
    }

    const driver_id = await get_driver_id(req.user?.id!);

    const driver = await Driver.findById(driver_id);
    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    driver.is_available = status;
    await driver.save();

    res.status(200).json({
      msg: "Driver availability set successfully",
      is_available: driver.is_available,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};
