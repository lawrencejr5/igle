import { Request, Response } from "express";
import { Types } from "mongoose";

import Ride from "../models/ride";
import Wallet from "../models/wallet";
import Activity from "../models/activity";
import Driver from "../models/driver";
import User from "../models/user";

import {
  get_driver_id,
  get_user_socket_id,
  get_driver_socket_id,
} from "../utils/get_id";
import { get_user_push_tokens, get_driver_push_tokens } from "../utils/get_id";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import { debit_wallet } from "../utils/wallet";
import { calculate_fare } from "../utils/calc_fare";
import { calculate_commission } from "../utils/calc_commision";
import { complete_ride } from "../utils/complete_ride";

import { io } from "../server";
import { sendExpoPush } from "../utils/expo_push";

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
              } else {
                const tokens = await get_driver_push_tokens(driverId);
                if (tokens.length) {
                  await sendExpoPush(
                    tokens,
                    "New ride request",
                    "A nearby rider needs a ride",
                    {
                      type: "new_ride_request",
                      rideId: new_ride._id,
                    }
                  );
                }
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
              } else {
                const tokens = await get_driver_push_tokens(driverId);
                if (tokens.length) {
                  await sendExpoPush(
                    tokens,
                    "New ride request",
                    "A nearby rider needs a ride",
                    {
                      type: "new_ride_request",
                      rideId: ride._id,
                    }
                  );
                }
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
              } else {
                const tokens = await get_driver_push_tokens(driverId);
                if (tokens.length) {
                  await sendExpoPush(
                    tokens,
                    "New ride request",
                    "A nearby rider needs a ride",
                    {
                      type: "new_ride_request",
                      rideId: new_ride._id,
                    }
                  );
                }
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
    } else {
      // Rider is not connected via socket — send push notification
      try {
        if (ride && ride.rider) {
          const tokens = await get_user_push_tokens(ride.rider);
          if (tokens.length) {
            console.log("Sending 'Driver on the way' push to tokens:", tokens);
            const res = await sendExpoPush(
              tokens,
              "Driver on the way",
              "A driver has accepted your ride",
              {
                type: "ride_accepted",
                rideId: ride._id,
              }
            );
            console.log("sendExpoPush result:", res);
          }
        }
      } catch (e) {
        console.error("Failed to get/send rider push tokens on accept:", e);
      }
      console.log("socket not found");
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

      if (riderTokens.length) {
        await sendExpoPush(
          riderTokens,
          "Ride cancelled",
          reason || "Ride was cancelled",
          {
            type: "ride_cancelled",
            rideId: ride._id,
            by,
          }
        );
      }

      if (driverTokens.length) {
        await sendExpoPush(
          driverTokens,
          "Ride cancelled",
          reason || "Ride was cancelled",
          {
            type: "ride_cancelled",
            rideId: ride._id,
            by,
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
        else {
          try {
            const tokens = ride?.rider
              ? await get_user_push_tokens(ride.rider)
              : [];
            if (tokens.length) {
              await sendExpoPush(
                tokens,
                "Your ride has arrived",
                "Your driver has arrived at pickup.",
                {
                  type: "ride_arrived",
                  rideId: ride._id,
                }
              );
            }
          } catch (e) {
            console.error("Failed to send arrived push to rider:", e);
          }
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
        if (user_socket)
          io.to(user_socket).emit("ride_in_progress", {
            msg: "Your ride has arrived",
          });
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
        else {
          try {
            const tokens = ride?.rider
              ? await get_user_push_tokens(ride.rider)
              : [];
            if (tokens.length) {
              console.log("Sending 'Ride completed' push to tokens:", tokens);
              const res = await sendExpoPush(
                tokens,
                "Ride completed",
                `Your ride to ${ride.destination.address} has been completed`,
                {
                  type: "ride_completed",
                  rideId: ride._id,
                }
              );
              console.log("sendExpoPush result:", res);
            }
          } catch (e) {
            console.error("Failed to send completed push to rider:", e);
          }
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
      type: "payment",
      channel: "wallet",
      ride_id: new Types.ObjectId(ride._id as string),
      reference: generate_unique_reference(),
      metadata: { for: "ride_payment" },
    });

    ride.payment_status = "paid";
    ride.payment_method = "wallet";
    await ride.save();

    // Notify driver about payment
    try {
      const driverTokens = ride?.driver
        ? await get_driver_push_tokens(ride.driver)
        : [];
      if (driverTokens.length) {
        await sendExpoPush(
          driverTokens,
          "Ride paid",
          `Rider has paid for ride ${ride._id}`,
          {
            type: "ride_paid",
            rideId: ride._id,
          }
        );
      }
    } catch (e) {
      console.error("Failed to send payment push to driver:", e);
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
