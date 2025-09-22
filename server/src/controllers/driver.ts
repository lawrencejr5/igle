import { Request, Response } from "express";

import Driver from "../models/driver";
import Wallet from "../models/wallet";
import Ride from "../models/ride";
import Transaction from "../models/transaction";

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
    const { vehicle_type, profile_img } = req.body;
    const user = req.user?.id;

    const existing_driver = await Driver.findOne({ user });
    if (existing_driver) {
      res.status(409).json({ msg: "Driver already exists for this user." });
      return;
    }

    const driver = await Driver.create({
      user,
      vehicle_type,
      profile_img,
      current_location: {
        type: "Point",
        coordinates: [0, 0],
      },
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
    const id = req.query.driver_id || (await get_driver_id(req.user?.id!));
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

// Get driver's active ride
export const get_driver_active_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    // Find the ride where driver is assigned and status is ongoing or accepted or arrived
    const activeRide = await Ride.findOne({
      driver: driver_id,
      status: { $in: ["ongoing", "accepted", "arrived"] },
    })
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone",
        },
      })
      .populate("rider", "name phone");
    if (!activeRide) {
      res.status(404).json({ msg: "No active ride found for this driver." });
      return;
    }
    res.status(200).json({ msg: "success", ride: activeRide });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Get driver transactions
export const get_driver_transactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const wallet = await Wallet.findOne({
      owner_id: driver_id,
      owner_type: "Driver",
    });

    if (!wallet) {
      res.status(404).json({ msg: "Driver wallet not found." });
      return;
    }

    const { limit = 20, skip = 0, type } = req.query;

    // Build query
    const query: any = { wallet_id: wallet._id };
    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate("ride_id");

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      msg: "success",
      transactions,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Set driver availability
export const set_driver_availability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status } = req.body;

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

// Update vehicle information
export const update_vehicle_info = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { vehicle } = req.body;
    const driver_id = await get_driver_id(req.user?.id!);

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      { vehicle },
      { new: true }
    );

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Vehicle information updated successfully",
      vehicle: driver.vehicle,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Update driver license information
export const update_driver_license = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { driver_licence } = req.body;
    const driver_id = await get_driver_id(req.user?.id!);

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      { driver_licence },
      { new: true }
    );

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver license information updated successfully",
      driver_licence: driver.driver_licence,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Set driver online status
export const set_driver_online_status = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { is_online } = req.body;
    const driver_id = await get_driver_id(req.user?.id!);

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      { is_online },
      { new: true }
    );

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver online status updated successfully",
      is_online: driver.is_online,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Get driver by user ID
export const get_driver_by_user = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const driver = await Driver.findOne({ user: user_id }).populate("user");

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({ msg: "success", driver });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Update driver rating
export const update_driver_rating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { rating } = req.body;
    const driver_id = await get_driver_id(req.user?.id!);

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      { rating },
      { new: true }
    );

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver rating updated successfully",
      rating: driver.rating,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Update driver info - flexible function to update any driver field
export const update_driver_info = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const updateData = req.body;

    // Remove any undefined or null values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(
        ([_, value]) => value !== undefined && value !== null
      )
    );

    if (Object.keys(cleanUpdateData).length === 0) {
      res.status(400).json({ msg: "No valid data provided for update." });
      return;
    }

    const driver = await Driver.findByIdAndUpdate(driver_id, cleanUpdateData, {
      new: true,
    });

    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver information updated successfully",
      driver,
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const save_bank_info = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    res.status(500).json({ msg: "Bank info is incorrect", err });
  }
};
