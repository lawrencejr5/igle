import { application, Request, Response } from "express";

import Driver from "../models/driver";
import Wallet from "../models/wallet";
import Ride from "../models/ride";
import Delivery from "../models/delivery";
import Transaction from "../models/transaction";
import User from "../models/user";

import { get_driver_id } from "../utils/get_id";

import axios from "axios";

import dotenv from "dotenv";
dotenv.config();
import { uploadToCloudinary } from "../utils/upload_file";
import { unlink } from "fs/promises";

// helper to safely delete temp files created by multer
const safeUnlink = async (path?: string | null) => {
  if (!path) return;
  try {
    await unlink(path);
  } catch (err) {
    console.error("Failed to delete temp file:", path, err);
  }
};

// Create a new driver
export const create_driver = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { vehicle_type } = req.body;
    const user = req.user?.id;

    const existing_driver = await Driver.findOne({ user });

    const driverData: any = {
      user,
      vehicle_type,
      current_location: {
        type: "Point",
        coordinates: [0, 0],
      },
    };

    let driver;
    if (existing_driver) {
      // Update the existing driver with provided data
      driver = await Driver.findByIdAndUpdate(existing_driver._id, driverData, {
        new: true,
      });

      // Ensure wallet exists (in case it was missing)
      const wallet = await Wallet.findOne({
        owner_id: driver?._id,
        owner_type: "Driver",
      });
      if (!wallet) {
        await Wallet.create({
          owner_id: driver?._id,
          owner_type: "Driver",
          balance: 0,
        });
      }

      res.status(200).json({ msg: "Driver updated successfully", driver });
      return;
    }

    // Create new driver
    driver = await Driver.create(driverData);

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

// Upload or update driver's profile image
export const upload_driver_profile_pic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const file = (req as any).file;
    if (!file || !file.path) {
      res.status(400).json({ msg: "No file provided" });
      return;
    }

    const filePath = file.path;
    let uploaded: any = null;
    try {
      uploaded = await uploadToCloudinary(
        filePath,
        "igle_images/driver_profile"
      );
    } finally {
      // remove multer temp file
      await safeUnlink(filePath);
    }

    if (!uploaded || !uploaded.url) {
      res.status(500).json({ msg: "Failed to upload image" });
      return;
    }

    const driver = await Driver.findById(driver_id);
    if (!driver) {
      res.status(404).json({ msg: "Driver not found" });
      return;
    }

    // Save new profile image URL
    driver.profile_img = uploaded.url;
    await driver.save();

    res
      .status(200)
      .json({ msg: "Profile image uploaded", profile_img: driver.profile_img });
  } catch (err) {
    console.error(err);
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

    // include driver wallet balance if exists
    const wallet = await Wallet.findOne({
      owner_id: driver._id,
      owner_type: "Driver",
    });

    res.status(200).json({
      msg: "success",
      driver,
      wallet_balance: wallet ? wallet.balance : 0,
    });
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

// Get driver's active delivery
export const get_driver_active_delivery = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    // Find the delivery where driver is assigned and status is active (accepted/arrived/in_transit)
    const activeDelivery = await Delivery.findOne({
      driver: driver_id,
      status: { $in: ["accepted", "arrived", "picked_up", "in_transit"] },
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
      .populate("sender", "name phone profile_pic");

    if (!activeDelivery) {
      res
        .status(404)
        .json({ msg: "No active delivery found for this driver." });
      return;
    }
    res.status(200).json({ msg: "success", delivery: activeDelivery });
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
    const {
      exterior_image,
      interior_image,
      brand,
      model,
      color,
      year,
      plate_number,
    } = req.body as any;

    if (!brand || !model || !color || !year || !plate_number) {
      res.status(400).json({ msg: "All vehicle fields are required." });
      return;
    }

    const driver_id = await get_driver_id(req.user?.id!);

    const files: any = (req as any).files || {};

    // Start with values from body (may be null/undefined)
    let exterior_image_url: string | null = exterior_image || null;
    let interior_image_url: string | null = interior_image || null;

    // Upload exterior if file provided
    if (
      files.vehicle_exterior &&
      Array.isArray(files.vehicle_exterior) &&
      files.vehicle_exterior[0] &&
      files.vehicle_exterior[0].path
    ) {
      const filePath = files.vehicle_exterior[0].path;
      try {
        const uploaded = await uploadToCloudinary(
          filePath,
          "igle_images/vehicle"
        );
        if (uploaded && uploaded.url) exterior_image_url = uploaded.url;
      } finally {
        await safeUnlink(filePath);
      }
    }

    // Upload interior if file provided
    if (
      files.vehicle_interior &&
      Array.isArray(files.vehicle_interior) &&
      files.vehicle_interior[0] &&
      files.vehicle_interior[0].path
    ) {
      const filePath = files.vehicle_interior[0].path;
      try {
        const uploaded = await uploadToCloudinary(
          filePath,
          "igle_images/vehicle"
        );
        if (uploaded && uploaded.url) interior_image_url = uploaded.url;
      } finally {
        await safeUnlink(filePath);
      }
    }

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      {
        vehicle: {
          exterior_image: exterior_image_url,
          interior_image: interior_image_url,
          brand,
          model,
          color,
          year,
          plate_number,
        },
      },
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
    // extract individual driver licence fields from body
    const {
      number,
      expiry_date,
      front_image,
      back_image,
      selfie_with_licence,
    } = req.body as any;

    if (!number || !expiry_date) {
      res
        .status(400)
        .json({ msg: "Driver licence number and expiry date are required." });
      return;
    }

    const driver_id = await get_driver_id(req.user?.id!);

    const files: any = (req as any).files || {};

    // start with provided values (may be null)
    let front_image_url: string | null = front_image || null;
    let back_image_url: string | null = back_image || null;
    let selfie_image_url: string | null = selfie_with_licence || null;

    // upload front image if provided
    if (
      files.license_front &&
      files.license_front[0] &&
      files.license_front[0].path
    ) {
      const filePath = files.license_front[0].path;
      try {
        const uploaded = await uploadToCloudinary(
          filePath,
          "igle_images/driver_license"
        );
        if (uploaded && uploaded.url) front_image_url = uploaded.url;
      } finally {
        await safeUnlink(filePath);
      }
    }

    // upload back image if provided
    if (
      files.license_back &&
      files.license_back[0] &&
      files.license_back[0].path
    ) {
      const filePath = files.license_back[0].path;
      try {
        const uploaded = await uploadToCloudinary(
          filePath,
          "igle_images/driver_license"
        );
        if (uploaded && uploaded.url) back_image_url = uploaded.url;
      } finally {
        await safeUnlink(filePath);
      }
    }

    // upload selfie with licence if provided (accept either field name variant)
    const selfieFile =
      files.selfie_with_license && files.selfie_with_license[0];
    if (selfieFile && selfieFile.path) {
      const filePath = selfieFile.path;
      try {
        const uploaded = await uploadToCloudinary(
          filePath,
          "igle_images/driver_license"
        );
        if (uploaded && uploaded.url) selfie_image_url = uploaded.url;
      } finally {
        await safeUnlink(filePath);
      }
    }

    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      {
        driver_licence: {
          number,
          expiry_date,
          front_image: front_image_url,
          back_image: back_image_url,
          selfie_with_licence: selfie_image_url,
        },
      },
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
    res.status(500).json({ msg: "Server error.", err });
    console.log(err);
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

    const driver = await Driver.findById(driver_id);
    if (!driver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    const files: any = (req as any).files || {};

    // Handle profile image upload
    if (
      files.profile_img &&
      Array.isArray(files.profile_img) &&
      files.profile_img[0] &&
      files.profile_img[0].path
    ) {
      const filePath = files.profile_img[0].path;
      try {
        const uploaded = await uploadToCloudinary(
          filePath,
          "igle_images/driver_profile"
        );
        if (uploaded && uploaded.url) updateData.profile_img = uploaded.url;
      } finally {
        await safeUnlink(filePath);
      }
    }

    // Handle vehicle images
    if (
      updateData.vehicle ||
      files.vehicle_exterior ||
      files.vehicle_interior
    ) {
      const vehicleData = updateData.vehicle || driver.vehicle || {};

      // Upload exterior image if provided
      if (
        files.vehicle_exterior &&
        Array.isArray(files.vehicle_exterior) &&
        files.vehicle_exterior[0] &&
        files.vehicle_exterior[0].path
      ) {
        const filePath = files.vehicle_exterior[0].path;
        try {
          const uploaded = await uploadToCloudinary(
            filePath,
            "igle_images/vehicle"
          );
          if (uploaded && uploaded.url)
            vehicleData.exterior_image = uploaded.url;
        } finally {
          await safeUnlink(filePath);
        }
      }

      // Upload interior image if provided
      if (
        files.vehicle_interior &&
        Array.isArray(files.vehicle_interior) &&
        files.vehicle_interior[0] &&
        files.vehicle_interior[0].path
      ) {
        const filePath = files.vehicle_interior[0].path;
        try {
          const uploaded = await uploadToCloudinary(
            filePath,
            "igle_images/vehicle"
          );
          if (uploaded && uploaded.url)
            vehicleData.interior_image = uploaded.url;
        } finally {
          await safeUnlink(filePath);
        }
      }

      updateData.vehicle = vehicleData;
    }

    // Handle driver licence images
    if (
      updateData.driver_licence ||
      files.license_front ||
      files.license_back ||
      files.selfie_with_license
    ) {
      const licenceData =
        updateData.driver_licence || driver.driver_licence || {};

      // Upload front image if provided
      if (
        files.license_front &&
        Array.isArray(files.license_front) &&
        files.license_front[0] &&
        files.license_front[0].path
      ) {
        const filePath = files.license_front[0].path;
        try {
          const uploaded = await uploadToCloudinary(
            filePath,
            "igle_images/driver_license"
          );
          if (uploaded && uploaded.url) licenceData.front_image = uploaded.url;
        } finally {
          await safeUnlink(filePath);
        }
      }

      // Upload back image if provided
      if (
        files.license_back &&
        Array.isArray(files.license_back) &&
        files.license_back[0] &&
        files.license_back[0].path
      ) {
        const filePath = files.license_back[0].path;
        try {
          const uploaded = await uploadToCloudinary(
            filePath,
            "igle_images/driver_license"
          );
          if (uploaded && uploaded.url) licenceData.back_image = uploaded.url;
        } finally {
          await safeUnlink(filePath);
        }
      }

      // Upload selfie with licence if provided
      if (
        files.selfie_with_license &&
        Array.isArray(files.selfie_with_license) &&
        files.selfie_with_license[0] &&
        files.selfie_with_license[0].path
      ) {
        const filePath = files.selfie_with_license[0].path;
        try {
          const uploaded = await uploadToCloudinary(
            filePath,
            "igle_images/driver_license"
          );
          if (uploaded && uploaded.url)
            licenceData.selfie_with_licence = uploaded.url;
        } finally {
          await safeUnlink(filePath);
        }
      }

      updateData.driver_licence = licenceData;
    }

    // Update driver with all data
    const updatedDriver = await Driver.findByIdAndUpdate(
      driver_id,
      updateData,
      {
        new: true,
      }
    ).populate("user");

    if (!updatedDriver) {
      res.status(404).json({ msg: "Driver not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver information updated successfully",
      driver: updatedDriver,
    });
  } catch (err) {
    console.error(err);
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
      application: "submitted",
    });

    res.json({ msg: "Bank info saved successfully" });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ msg: "Bank info is incorrect", err });
  }
};

// Get driver's completed rides
export const get_driver_completed_rides = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const { limit = 20, skip = 0 } = req.query;

    const completedRides = await Ride.find({
      driver: driver_id,
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate({ path: "rider", select: "name phone" })
      .populate({
        path: "driver",
        select: "user vehicle_type vehicle rating",
        populate: { path: "user", select: "name phone" },
      });

    // Get total count for pagination
    const total = await Ride.countDocuments({
      driver: driver_id,
      status: "completed",
    });

    res.status(200).json({
      msg: "success",
      rides: completedRides,
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

// Get driver's cancelled rides
export const get_driver_cancelled_rides = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const { limit = 20, skip = 0 } = req.query;

    const cancelledRides = await Ride.find({
      driver: driver_id,
      status: "cancelled",
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate({ path: "rider", select: "name phone" })
      .populate({
        path: "driver",
        select: "user vehicle_type vehicle rating",
        populate: { path: "user", select: "name phone" },
      });

    // Get total count for pagination
    const total = await Ride.countDocuments({
      driver: driver_id,
      status: "cancelled",
    });

    res.status(200).json({
      msg: "success",
      rides: cancelledRides,
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

// Get all driver's rides (completed and cancelled)
export const get_driver_rides_history = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const { limit = 20, skip = 0, status } = req.query;

    // Build query
    const query: any = {
      driver: driver_id,
      status: status || { $in: ["completed", "cancelled"] },
    };

    const rides = await Ride.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate({ path: "rider", select: "name phone" })
      .populate({
        path: "driver",
        select: "user vehicle_type vehicle rating",
        populate: { path: "user", select: "name phone" },
      });

    // Get total count for pagination
    const total = await Ride.countDocuments(query);

    res.status(200).json({
      msg: "success",
      rides,
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

// Get driver's delivered deliveries
export const get_driver_delivered_deliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const { limit = 5, skip = 0 } = req.query;

    const Delivery = (await import("../models/delivery")).default;

    const deliveries = await Delivery.find({
      driver: driver_id,
      status: "delivered",
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate("sender", "name phone profile_pic")
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      });

    const total = await Delivery.countDocuments({
      driver: driver_id,
      status: "delivered",
    });

    res.status(200).json({
      msg: "success",
      deliveries,
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

// Get driver's cancelled deliveries
export const get_driver_cancelled_deliveries = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const { limit = 5, skip = 0 } = req.query;

    const Delivery = (await import("../models/delivery")).default;

    const deliveries = await Delivery.find({
      driver: driver_id,
      status: "cancelled",
    })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate("sender", "name phone profile_pic")
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      });

    const total = await Delivery.countDocuments({
      driver: driver_id,
      status: "cancelled",
    });

    res.status(200).json({
      msg: "success",
      deliveries,
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

// --- Admin functions (moved to bottom) ---

// Admin: fetch all drivers (paginated)
export const admin_get_drivers = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin") {
    res.status(403).json({ msg: "admin role required for this action" });
    return;
  }

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const { status, search, dateFrom, dateTo } = req.query as any;

    const filter: any = { application: "approved" };

    // Status filter
    if (status) {
      if (status === "active") filter.is_active = true;
      else if (status === "suspended") filter.is_active = false;
    }

    // Date range filters
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Get all drivers with populated data for search
    let drivers = await Driver.find(filter)
      .populate("user")
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      drivers = drivers.filter((driver: any) => {
        const id = driver._id.toString().toLowerCase();
        const userName = (driver.user?.name || "").toLowerCase();
        const userEmail = (driver.user?.email || "").toLowerCase();
        const userPhone = (driver.user?.phone || "").toLowerCase();
        const vehicleType = (driver.vehicle_type || "").toLowerCase();
        const plateNumber = (driver.vehicle?.plate_number || "").toLowerCase();

        return (
          id.includes(searchLower) ||
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          userPhone.includes(searchLower) ||
          vehicleType.includes(searchLower) ||
          plateNumber.includes(searchLower)
        );
      });
    }

    // Get total count and apply pagination
    const total = drivers.length;
    const paginatedDrivers = drivers.slice(skip, skip + limit);

    const pages = Math.ceil(total / limit);
    return res
      .status(200)
      .json({ msg: "success", drivers: paginatedDrivers, total, page, pages });
  } catch (err) {
    console.error("admin_get_drivers error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: fetch driver by id (query ?id=...)
export const admin_get_driver = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin") {
    res.status(403).json({ msg: "admin role required for this action" });
    return;
  }

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const driver = await Driver.findById(id).populate("user");
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    const wallet = await Wallet.findOne({
      owner_id: driver._id,
      owner_type: "Driver",
    });

    res.status(200).json({
      msg: "success",
      driver,
      wallet_balance: wallet ? wallet.balance : 0,
    });
  } catch (err) {
    console.error("admin_get_driver error:", err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Admin: edit driver
export const admin_edit_driver = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin") {
    res.status(403).json({ msg: "admin role required for this action" });
    return;
  }

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const allowed = [
      "profile_img",
      "vehicle_type",
      "vehicle",
      "is_available",
      "rating",
      "bank",
      "driver_licence",
      "total_trips",
      "num_of_reviews",
    ];

    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    if (Object.keys(update).length === 0)
      return res.status(400).json({ msg: "Nothing to update" });

    const driver = await Driver.findByIdAndUpdate(id, update, { new: true });
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    res.status(200).json({ msg: "Driver updated", driver });
  } catch (err) {
    console.error("admin_edit_driver error:", err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Admin: delete driver and related data
export const admin_delete_driver = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin") {
    res.status(403).json({ msg: "admin role required for this action" });
    return;
  }

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    const soft = req.query.soft === "true" || req.body?.soft === true;
    if (soft) {
      // attempt soft-delete if schema allows
      try {
        (driver as any).is_deleted = true;
        (driver as any).deleted_at = new Date();
        (driver as any).deleted_by = req.user?.id;
        await driver.save();
        return res.status(200).json({ msg: "Driver soft-deleted" });
      } catch (e) {
        console.warn(
          "soft-delete not supported on Driver schema, falling back to hard delete",
          e
        );
      }
    }

    // delete driver's wallets and transactions
    const wallets = await Wallet.find({ owner_id: driver._id });
    const walletIds = wallets.map((w) => w._id);
    if (walletIds.length) {
      await Transaction.deleteMany({ wallet_id: { $in: walletIds } });
      await Wallet.deleteMany({ _id: { $in: walletIds } });
    }

    // delete rides and deliveries where driver is assigned
    await Ride.deleteMany({ driver: driver._id });
    await Delivery.deleteMany({ driver: driver._id });

    // delete driver record
    await Driver.deleteOne({ _id: driver._id });

    // optionally, do not delete the user account here — admins may prefer that
    res.status(200).json({ msg: "Driver and related data deleted" });
  } catch (err) {
    console.error("admin_delete_driver error:", err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Admin: block or unblock driver (also blocks associated user)
export const admin_block_driver = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin") {
    res.status(403).json({ msg: "admin role required for this action" });
    return;
  }

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const block = req.body?.block === true || req.query?.block === "true";

    const driver = await Driver.findById(id);
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    // set block flags on driver (if schema allows)
    try {
      (driver as any).is_blocked = block;
      (driver as any).blocked_at = block ? new Date() : null;
      (driver as any).blocked_by = block ? req.user?.id : null;
      await driver.save();
    } catch (e) {
      console.warn("could not set block fields on Driver schema:", e);
    }

    // also block/unblock the associated user to prevent login
    if (driver.user) {
      const user = await User.findById(driver.user);
      if (user) {
        user.is_blocked = block as any;
        user.blocked_at = block ? new Date() : undefined;
        user.blocked_by = block ? (req.user?.id as any) : undefined;
        await user.save();
      }
    }

    return res
      .status(200)
      .json({ msg: block ? "Driver blocked" : "Driver unblocked" });
  } catch (err) {
    console.error("admin_block_driver error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: list driver applications (submitted)
export const admin_get_driver_applications = async (
  req: Request,
  res: Response
) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    // const includeDeleted = req.query.include_deleted === "true";
    const filter: any = { application: "submitted" };
    // if (!includeDeleted) filter.is_deleted = false;

    const [total, drivers] = await Promise.all([
      Driver.countDocuments(filter),
      Driver.find(filter)
        .populate("user")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    const pages = Math.ceil(total / limit);
    return res
      .status(200)
      .json({ msg: "success", drivers, total, page, pages });
  } catch (err) {
    console.error("admin_get_driver_applications error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: approve or reject a driver's application
export const admin_process_driver_application = async (
  req: Request,
  res: Response
) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const action = (req.query.action || req.body?.action || "")
      .toString()
      .toLowerCase();
    if (!["approve", "reject"].includes(action))
      return res
        .status(400)
        .json({ msg: "action must be 'approve' or 'reject'" });

    const driver = await Driver.findById(id).populate("user");
    if (!driver) return res.status(404).json({ msg: "Driver not found" });

    if (action === "approve") {
      driver.application = "approved" as any;
      await driver.save();

      // mark user as driver and ensure wallet exists
      if (driver.user) {
        const user = await User.findById(driver.user as any);
        if (user) {
          user.is_driver = true as any;
          await user.save();
        }
      }

      // ensure wallet exists
      const wallet = await Wallet.findOne({
        owner_id: driver._id,
        owner_type: "Driver",
      });
      if (!wallet) {
        await Wallet.create({
          owner_id: driver._id,
          owner_type: "Driver",
          balance: 0,
        });
      }

      return res
        .status(200)
        .json({ msg: "Driver application approved", driver });
    }

    // reject
    driver.application = "rejected" as any;
    await driver.save();
    return res.status(200).json({ msg: "Driver application rejected", driver });
  } catch (err) {
    console.error("admin_process_driver_application error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
