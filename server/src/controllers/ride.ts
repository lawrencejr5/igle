import { Request, Response } from "express";
import { Types } from "mongoose";

import Ride from "../models/ride";
import Wallet from "../models/wallet";
import Activity from "../models/activity";
import Driver from "../models/driver";

import {
  get_driver_id,
  get_user_socket_id,
  get_driver_socket_id,
  get_driver_user_id,
} from "../utils/get_id";
import { get_user_push_tokens, get_driver_push_tokens } from "../utils/get_id";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import { debit_wallet } from "../utils/wallet";
import { calculate_fare } from "../utils/calc_fare";
import { calculate_commission } from "../utils/calc_commision";
import { complete_ride } from "../utils/complete_ride";

import { io } from "../server";
import { sendNotification } from "../utils/expo_push";

// 🔄 Helper: Expire a ride
const expire_ride = async (ride_id: string, user_id?: string) => {
  const ride = await Ride.findById(ride_id);
  if (!ride || !["pending", "scheduled"].includes(ride.status)) return;
  ride.status = "expired";
  await ride.save();

  // Notify rider
  if (user_id) {
    const user_socket = await get_user_socket_id(user_id);
    if (user_socket) {
      io.to(user_socket).emit("ride_timeout", {
        ride_id,
        msg: "No drivers accepted your ride in time.",
      });
    }
  }

  // Notify drivers to ignore this ride request
  io.emit("ride_request_expired", {
    ride_id,
    msg: "This ride has expired",
  });
};

export const request_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { km, min, scheduled_time } = req.query;
    const { pickup, destination, vehicle, fare } = req.body;

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
      return;
    }

    const distance_km = Number(km);
    const duration_mins = Number(min);
    const commission = calculate_commission(fare);
    const driver_earnings = fare - commission;

    const new_ride = await Ride.create({
      rider: user_id,
      pickup,
      destination,
      fare,
      vehicle,
      distance_km: Math.round(distance_km),
      duration_mins: Math.round(duration_mins),
      driver_earnings,
      commission,
      status: scheduled_time ? "scheduled" : "pending",
      scheduled: scheduled_time ? true : false,
      scheduled_time: scheduled_time
        ? new Date(scheduled_time as string)
        : null,
    });

    // Notify only drivers of the requested vehicle type
    try {
      if (vehicle) {
        // find drivers with the requested vehicle type
        const drivers = await Driver.find({ vehicle_type: vehicle });

        // notify connected drivers via sockets and offline via push
        await Promise.all(
          drivers.map(async (d) => {
            try {
              const driverId = String((d as any)._id);
              const driverSocket = await get_driver_socket_id(driverId);
              if (driverSocket) {
                io.to(driverSocket).emit("new_ride_request", {
                  ride_id: new_ride._id,
                });
              }
            } catch (e) {
              console.error("Failed to notify driver", d._id, e);
            }
          })
        );
      } else {
        // fallback: notify all drivers
        io.emit("new_ride_request", { ride_id: new_ride._id });
      }
    } catch (notifyErr) {
      console.error("Error notifying drivers for ride request:", notifyErr);
      // fallback to global emit
      io.emit("new_ride_request", { ride_id: new_ride._id });
    }

    // Start expiration timeout
    setTimeout(
      () => expire_ride(new_ride._id as string, new_ride.rider.toString()),
      30000
    );

    res.status(201).json({
      msg: scheduled_time ? "Scheduled ride created" : "Ride request created",
      ride: new_ride,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ msg: "Failed to create ride request", err: err.message });
  }
};

export const retry_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ride_id } = req.query;
    if (!ride_id) {
      res.status(400).json({ msg: "ride_id is required" });
      return;
    }

    const ride = await Ride.findById(ride_id);
    if (!ride) {
      res.status(404).json({ msg: "Ride not found" });
      return;
    }

    if (ride.status !== "expired") {
      res.status(400).json({ msg: "Only expired rides can be retried" });
      return;
    }

    if (ride.scheduled_time) ride.status = "scheduled";
    else ride.status = "pending";

    await ride.save();

    // Notify only drivers of the ride's vehicle type when retrying
    try {
      if (ride.vehicle) {
        const drivers = await Driver.find({ vehicle_type: ride.vehicle });
        await Promise.all(
          drivers.map(async (d) => {
            try {
              const driverId = String((d as any)._id);
              const driverSocket = await get_driver_socket_id(driverId);
              if (driverSocket) {
                io.to(driverSocket).emit("new_ride_request", {
                  ride_id: ride._id,
                });
              }
            } catch (e) {
              console.error("Failed to notify driver", d._id, e);
            }
          })
        );
      } else {
        io.emit("new_ride_request", { ride_id: ride._id });
      }
    } catch (e) {
      console.error("Notify retry error:", e);
      io.emit("new_ride_request", { ride_id: ride._id });
    }

    res.status(200).json({
      msg: "Retrying ride request...",
      ride,
    });

    // Start expiration timeout
    setTimeout(
      () => expire_ride(ride._id as string, ride.rider.toString()),
      30000
    );
  } catch (err: any) {
    res.status(500).json({ msg: "Failed to retry ride", err: err.message });
  }
};

export const rebook_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { ride_id } = req.query;
    if (!ride_id) {
      res.status(400).json({ msg: "ride_id is required" });
      return;
    }

    const ride = await Ride.findById(ride_id);
    if (!ride) {
      res.status(404).json({ msg: "Ride not found" });
      return;
    }

    const distance_km = Number(ride.distance_km);
    const duration_mins = Number(ride.duration_mins);

    if (isNaN(distance_km) || isNaN(duration_mins)) {
      res.status(400).json({ msg: "Invalid ride metrics" });
      return;
    }

    const fare = calculate_fare(distance_km, duration_mins);
    const commission = calculate_commission(fare);
    const driver_earnings = fare - commission;

    const new_ride = await Ride.create({
      rider: ride.rider,
      pickup: ride.pickup,
      destination: ride.destination,
      fare,
      distance_km,
      duration_mins,
      driver_earnings,
      commission,
      status: "pending",
    });

    // Notify only drivers matching original ride vehicle type
    try {
      if (new_ride.vehicle) {
        const drivers = await Driver.find({ vehicle_type: new_ride.vehicle });
        await Promise.all(
          drivers.map(async (d) => {
            try {
              const driverId = String((d as any)._id);
              const driverSocket = await get_driver_socket_id(driverId);
              if (driverSocket) {
                io.to(driverSocket).emit("new_ride_request", {
                  ride_id: new_ride._id,
                });
              }
            } catch (e) {
              console.error("Failed to notify driver", d._id, e);
            }
          })
        );
      } else {
        io.emit("new_ride_request", { ride_id: new_ride._id });
      }
    } catch (e) {
      console.error("Notify rebook error:", e);
      io.emit("new_ride_request", { ride_id: new_ride._id });
    }

    res.status(201).json({
      msg: "Ride has been rebooked",
      ride: new_ride,
    });

    // Start expiration timeout
    setTimeout(
      () => expire_ride(new_ride._id as string, new_ride.rider.toString()),
      30000
    );
  } catch (err: any) {
    res.status(500).json({ msg: "Failed to rebook ride", err: err.message });
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

    const ride = await Ride.findById(ride_id)
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("rider", "name phone profile_pic");
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
    const { status } = req.query;

    const queryObj: { status?: string } = {};
    if (status) queryObj.status = status as string;

    const rides = await Ride.find({ rider: user_id, ...queryObj })
      .sort({ createdAt: -1 })
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("rider", "name phone profile_pic");
    res.status(200).json({ msg: "success", rowCount: rides.length, rides });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_active_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const ride = await Ride.findOne({
      rider: user_id,
      status: { $in: ["pending", "accepted", "ongoing", "arrived", "expired"] },
      scheduled: false,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("rider", "name phone profile_pic");
    res.status(200).json({ msg: "success", ride });
  } catch (error) {
    res.status(500).json({ msg: "An error occurred while fetching ride" });
  }
};
export const get_user_ongoing_ride = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const ride = await Ride.findOne({
      rider: user_id,
      status: "ongoing",
      scheduled: false,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("rider", "name phone profile_pic");
    res.status(200).json({ msg: "success", ride });
  } catch (error) {
    res.status(500).json({ msg: "An error occurred while fetching ride" });
  }
};

export const get_user_scheduled_rides = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const rides = await Ride.find({
      rider: user_id,
      status: { $in: ["pending", "accepted", "arrived", "expired"] },
      scheduled: true,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("rider", "name phone profile_pic");
    res.status(200).json({ msg: "success", row_count: rides.length, rides });
  } catch (error) {
    res.status(500).json({ msg: "An error occurred while fetching ride" });
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
      {
        _id: ride_id,
        status: { $in: ["pending", "scheduled"] },
        driver: { $exists: false },
      },
      { driver: driver_id, status: "accepted" },
      { new: true }
    );

    const rider_socket_id = await get_user_socket_id(ride?.rider!);
    const rider_socket = io.sockets.sockets.get(rider_socket_id!);

    if (rider_socket) {
      io.to(rider_socket_id!).emit("ride_accepted", {
        ride_id,
        driver_id,
        rider_socket_id,
      });
    }

    // Send notification to rider regardless of socket connection
    try {
      if (ride && ride.rider) {
        const tokens = await get_user_push_tokens(ride.rider);
        if (tokens.length) {
          console.log("Sending 'Driver on the way' push to tokens:", tokens);
          const res = await sendNotification(
            [String(ride.rider)],
            "Driver on the way",
            "A driver has accepted your ride",
            {
              type: "ride_booking",
              ride_id: ride._id,
            }
          );
        }
      }
    } catch (e) {
      console.error("Failed to get/send rider push tokens on accept:", e);
    }

    io.emit("ride_taken", {
      ride_id,
      msg: "This ride has been taken by another driver",
      driver_id,
    });

    if (!ride) {
      res.status(404).json({ msg: "Ride is no longer available." });
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

    // Emitting ride cancellation
    const user_socket = await get_user_socket_id(ride.rider!);
    const driver_socket = await get_driver_socket_id(ride.driver!);
    if (user_socket)
      io.to(user_socket).emit("ride_cancel", { reason, by, ride_id });
    if (driver_socket)
      io.to(driver_socket).emit("ride_cancel", { reason, by, ride_id });

    // Mark ride as cancelled
    ride.status = "cancelled";
    ride.timestamps = {
      ...ride.timestamps,
      cancelled_at: new Date(),
    };

    ride.cancelled.by = by;
    if (reason) ride.cancelled.reason = reason;

    await ride.save();
    // Send push notifications to rider and driver if not connected via socket
    try {
      const riderTokens = ride?.rider
        ? await get_user_push_tokens(ride.rider)
        : [];
      const driverTokens = ride?.driver
        ? await get_driver_push_tokens(ride.driver)
        : [];

      const driver_user_id = await get_driver_user_id(String(ride.driver!));

      // Send notification to rider if tokens exist
      if (riderTokens.length) {
        await sendNotification(
          [String(ride.rider)],
          "Ride cancelled",
          `Ride to ${ride.destination.address} cancelled by ${
            ride.cancelled.by === "rider" ? "you" : "the driver"
          }`,
          {
            type: "ride_cancelled",
            ride_id: ride._id,
          }
        );
      }

      // Send notification to driver if tokens exist
      if (driverTokens.length) {
        await sendNotification(
          [String(driver_user_id)],
          "Ride cancelled",
          `Ride to ${ride.destination.address} cancelled by ${
            ride.cancelled.by === "driver" ? "you" : "rider"
          }`,
          {
            type: "ride_cancelled",
            ride_id: ride._id,
            role: "driver",
          }
        );
      }
    } catch (e) {
      console.error("Failed to send cancel push notifications:", e);
    }

    res.status(200).json({ msg: "Ride cancelled successfully.", ride });
  } catch (err) {
    res.status(500).json({ msg: "Server error.", error: err });
    console.error(err);
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

    const user_socket = await get_user_socket_id(ride.rider!);
    const driver_socket = await get_driver_socket_id(ride.driver!);

    const tokens = ride?.rider ? await get_user_push_tokens(ride.rider) : [];

    switch (status) {
      // arrived at destination
      case "arrived":
        if (ride.status !== "accepted") {
          res.status(400).json({
            msg: "Failed to update ride status",
          });
          return;
        }
        // Emitting ride status
        if (user_socket)
          io.to(user_socket).emit("ride_arrival", {
            msg: "Your ride has arrived",
          });

        // Send notification regardless of socket connection
        try {
          if (tokens.length) {
            await sendNotification(
              [String(ride.rider)],
              "Your ride has arrived",
              "Your driver has arrived at pickup.",
              {
                type: "ride_booking",
                ride_id: ride._id,
              }
            );
          }
        } catch (e) {
          console.error("Failed to send arrived push to rider:", e);
        }
        if (driver_socket)
          io.to(driver_socket).emit("ride_arrival", {
            msg: "You have arrived",
          });

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
        }
        if (ride.payment_status !== "paid") {
          res.status(400).json({
            msg: "This ride cannot start unless payment has been made",
          });
          return;
        }
        // Emitting ride status
        if (user_socket) {
          io.to(user_socket).emit("ride_in_progress", {
            msg: "Your ride has arrived",
          });
        }

        // Send notification regardless of socket connection
        if (tokens.length) {
          await sendNotification(
            [String(ride.rider)],
            "Your ride has started",
            "Your driver has started the ride.",
            {
              type: "ride_booking",
              ride_id: ride._id,
            }
          );
        }
        if (driver_socket)
          io.to(driver_socket).emit("ride_in_progress", {
            msg: "You have arrived",
          });

        ride.timestamps.started_at = new Date();
        ride.status = "ongoing";
        break;

      // end ride
      case "completed":
        if (ride.status !== "ongoing") {
          res.status(400).json({ msg: "Failed to complete this ride" });
          return;
        }

        const driver = await Driver.findById(ride.driver);
        if (driver) {
          driver.total_trips += 1;
          await driver.save();
        }

        const result = await complete_ride(ride);

        // Emitting ride status
        if (user_socket)
          io.to(user_socket).emit("ride_completed", {
            msg: "Your ride has been completed",
          });

        // Send notification regardless of socket connection
        try {
          if (tokens.length) {
            console.log("Sending 'Ride completed' push to tokens:", tokens);
            const res = await sendNotification(
              [String(ride.rider)],
              "Ride completed",
              `Your ride to ${ride.destination.address} has been completed`,
              {
                type: "ride_completed",
                ride_id: ride._id,
              }
            );
          }
        } catch (e) {
          console.error("Failed to send completed push to rider:", e);
        }
        if (driver_socket)
          io.to(driver_socket).emit("ride_completed", {
            msg: "You have finished the ride",
          });

        await Activity.create({
          type: "ride",
          user: ride.rider,
          title: "Ride completed",
          message: `Your ride to ${ride.destination.address} has been completed`,
          metadata: { ride_id: ride._id, driver_id: ride.driver },
        });

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
    if (!ride) {
      return res.status(400).json({ msg: "Invalid ride or status" });
    }

    const wallet = await Wallet.findOne({ owner_id: user_id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const transaction = await debit_wallet({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount: ride.fare,
      type: "ride_payment",
      channel: "wallet",
      ride_id: new Types.ObjectId(ride._id as string),
      reference: generate_unique_reference(),
      metadata: { for: "ride_payment" },
    });

    ride.payment_status = "paid";
    ride.payment_method = "wallet";
    await ride.save();

    // Emit socket event to assigned driver (if connected)
    try {
      const driver_socket = ride?.driver
        ? await get_driver_socket_id(ride.driver)
        : null;
      if (driver_socket) {
        io.to(driver_socket).emit("paid_for_ride", {
          ride_id: ride._id,
          msg: "Rider has paid for ride",
        });
      }
    } catch (e) {
      console.error("Failed to emit paid_for_ride socket to driver:", e);
    }

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

// --- Admin functions (moved to bottom) ---

// Admin: fetch paginated rides with rider and driver populated
export const admin_get_rides = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const { status, search, dateFrom, dateTo } = req.query as any;

    const filter: any = {};
    if (status) filter.status = status;

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

    // Get all rides with populated data for search
    let rides = await Ride.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "rider", select: "name phone" })
      .populate({
        path: "driver",
        select: "user vehicle_type vehicle",
        populate: { path: "user", select: "name phone" },
      });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      rides = rides.filter((ride: any) => {
        const id = ride._id.toString().toLowerCase();
        const riderName = (ride.rider?.name || "").toLowerCase();
        const driverName = (ride.driver?.user?.name || "").toLowerCase();
        const pickupAddress = (ride.pickup?.address || "").toLowerCase();
        const destinationAddress = (
          ride.destination?.address || ""
        ).toLowerCase();
        const vehicle = (ride.vehicle || "").toLowerCase();
        const rideStatus = (ride.status || "").toLowerCase();

        return (
          id.includes(searchLower) ||
          riderName.includes(searchLower) ||
          driverName.includes(searchLower) ||
          pickupAddress.includes(searchLower) ||
          destinationAddress.includes(searchLower) ||
          vehicle.includes(searchLower) ||
          rideStatus.includes(searchLower)
        );
      });
    }

    // Get total count and apply pagination
    const total = rides.length;
    const paginatedRides = rides.slice(skip, skip + limit);

    const pages = Math.ceil(total / limit);
    return res
      .status(200)
      .json({ msg: "success", rides: paginatedRides, total, page, pages });
  } catch (err) {
    console.error("admin_get_rides error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: get single ride details (populate rider and driver, include related counts)
export const admin_get_ride = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(
      req.query.id ||
        req.query.ride_id ||
        req.query.rideId ||
        req.body?.id ||
        ""
    );
    if (!id) return res.status(400).json({ msg: "id is required" });

    const ride = await Ride.findById(id)
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("rider", "name phone profile_pic");

    if (!ride) return res.status(404).json({ msg: "Ride not found" });

    // fetch related transactions and activities counts (quietly — non-blocking if model missing)
    let transactionsCount = 0;
    let activitiesCount = 0;
    try {
      const transactionModel = (await import("../models/transaction")).default;
      transactionsCount = await transactionModel.countDocuments({
        ride_id: ride._id,
      } as any);
    } catch (e) {
      // ignore if transaction model not available
    }

    try {
      activitiesCount = await Activity.countDocuments({
        "metadata.ride_id": ride._id,
      } as any);
    } catch (e) {
      // ignore
    }

    return res
      .status(200)
      .json({ msg: "success", ride, transactionsCount, activitiesCount });
  } catch (err) {
    console.error("admin_get_ride error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: cancel an ongoing ride
export const admin_cancel_ride = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const reason = (
      req.query.reason ||
      req.body?.reason ||
      "Cancelled by admin"
    ).toString();

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: "Ride not found" });

    if (ride.status !== "ongoing") {
      return res
        .status(400)
        .json({ msg: "Only ongoing rides can be cancelled by admin" });
    }

    // Notify rider and driver via sockets and push
    const user_socket = await get_user_socket_id(ride.rider!);
    const driver_socket = await get_driver_socket_id(ride.driver!);
    if (user_socket)
      io.to(user_socket).emit("ride_cancel", {
        reason,
        by: "admin",
        ride_id: id,
      });
    if (driver_socket)
      io.to(driver_socket).emit("ride_cancel", {
        reason,
        by: "admin",
        ride_id: id,
      });

    // set ride cancelled metadata
    ride.status = "cancelled";
    ride.timestamps = {
      ...(ride.timestamps || {}),
      cancelled_at: new Date(),
    } as any;
    ride.cancelled = { by: "admin", reason } as any;
    await ride.save();

    try {
      const riderTokens = ride?.rider
        ? await get_user_push_tokens(ride.rider)
        : [];
      const driverTokens = ride?.driver
        ? await get_driver_push_tokens(ride.driver)
        : [];

      const driver_user_id = get_driver_user_id(String(ride.driver));

      if (riderTokens.length) {
        await sendNotification(
          [String(ride.rider)],
          "Ride cancelled",
          "Ride was cancelled by Igle",
          {
            type: "ride_cancelled",
            ride_id: ride._id,
            by: "admin",
          }
        );
      }
      if (driverTokens.length) {
        await sendNotification(
          [String(driver_user_id)],
          "Ride cancelled",
          "Ride was cancelled by Igle",
          {
            type: "ride_cancelled",
            ride_id: ride._id,
            by: "admin",
            role: "driver",
          }
        );
      }
    } catch (e) {
      console.error("Failed to send cancel push notifications:", e);
    }

    return res.status(200).json({ msg: "Ride cancelled by admin", ride });
  } catch (err) {
    console.error("admin_cancel_ride error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: delete a ride and related data (transactions, activities)
export const admin_delete_ride = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const ride = await Ride.findById(id);
    if (!ride) return res.status(404).json({ msg: "Ride not found" });

    // delete related transactions
    try {
      await Wallet.deleteMany({}); // noop placeholder - keep wallets intact
    } catch (e) {
      // ignore
    }

    // delete transactions linked to this ride
    await (
      await import("../models/transaction")
    ).default.deleteMany({ ride_id: ride._id } as any);

    // delete activities related to this ride
    await Activity.deleteMany({ "metadata.ride_id": ride._id } as any);

    // delete the ride itself
    await Ride.deleteOne({ _id: ride._id });

    return res.status(200).json({ msg: "Ride and related data deleted" });
  } catch (err) {
    console.error("admin_delete_ride error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
