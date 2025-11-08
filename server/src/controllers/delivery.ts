import { Request, Response } from "express";
import Delivery from "../models/delivery";
import Driver from "../models/driver";
import { calculate_commission } from "../utils/calc_commision";
import { io } from "../server";
import {
  get_user_socket_id,
  get_driver_socket_id,
  get_driver_id,
  get_driver_push_tokens,
  get_user_push_tokens,
} from "../utils/get_id";
import { sendExpoPush } from "../utils/expo_push";
import { complete_delivery } from "../utils/complete_delivery";
import { Types } from "mongoose";
import Activity from "../models/activity";

// expire delivery helper
const expire_delivery = async (delivery_id: string, user_id?: string) => {
  const delivery = await Delivery.findById(delivery_id);
  if (!delivery || !["pending", "scheduled"].includes(delivery.status)) return;
  delivery.status = "expired" as any;
  await delivery.save();

  // Notify sender
  if (user_id) {
    const user_socket = await get_user_socket_id(user_id);
    if (user_socket)
      io.to(user_socket).emit("delivery_timeout", { delivery_id });
  }

  // notify drivers to ignore
  io.emit("delivery_request_expired", {
    delivery_id,
    msg: "Delivery request expired",
  });
};

export const request_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const { km, min, scheduled_time } = req.query;
    // accept package info and optional from/to contact objects in the body
    const { pickup, dropoff, vehicle, fare, package_data, to } =
      req.body as any;

    if (!pickup || !pickup.coordinates || !dropoff || !dropoff.coordinates)
      return res
        .status(400)
        .json({ msg: "Pickup and dropoff coordinates required" });

    if (!package_data)
      return res.status(400).json({ msg: "Package information required" });

    if (!km || !min)
      return res.status(400).json({ msg: "Distance and duration required" });

    const distance_km = Number(km);
    const duration_mins = Number(min);
    const fareNum = Number(fare) || 0;

    const commission = calculate_commission(fareNum);
    const driver_earnings = fareNum - commission;

    const new_delivery = await Delivery.create({
      sender: user_id,
      pickup,
      dropoff,
      to: to || undefined,
      package: package_data,
      fare: fareNum,
      distance_km,
      duration_mins,
      vehicle,
      driver_earnings,
      commission,
      status: scheduled_time ? "scheduled" : "pending",
      scheduled: scheduled_time ? true : false,
      scheduled_time: scheduled_time
        ? new Date(scheduled_time as string)
        : null,
    });

    // notify drivers. If a vehicle type was specified, only notify drivers of that type
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
                io.to(driverSocket).emit("delivery_request", {
                  delivery_id: new_delivery._id,
                });
              } else {
                const tokens = await get_driver_push_tokens(driverId);
                if (tokens.length) {
                  await sendExpoPush(
                    tokens,
                    "New delivery request",
                    "A nearby sender needs a delivery",
                    {
                      type: "delivery_request",
                      deliveryId: new_delivery._id,
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
        io.emit("delivery_request", { delivery_id: new_delivery._id });
      }
    } catch (notifyErr) {
      console.error("Error notifying drivers for delivery request:", notifyErr);
      // fallback to global emit
      io.emit("delivery_request", { delivery_id: new_delivery._id });
    }

    // expiration timeout (30s similar to rides)
    setTimeout(
      () =>
        expire_delivery(
          new_delivery._id as string,
          new_delivery.sender.toString()
        ),
      30000
    );

    res.status(201).json({
      msg: scheduled_time
        ? "Scheduled delivery created"
        : "Delivery request created",
      delivery: new_delivery,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ msg: "Failed to create delivery", err: err.message });
  }
};

export const retry_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    if (!delivery_id)
      return res.status(400).json({ msg: "delivery_id required" });

    const delivery = await Delivery.findById(delivery_id);
    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    if (delivery.status !== "expired")
      return res.status(400).json({ msg: "Delivery not expired" });

    delivery.status = delivery.scheduled_time ? "scheduled" : "pending";
    await delivery.save();

    // Notify drivers: if a vehicle type was specified, only notify drivers of that type
    try {
      if ((delivery as any).vehicle) {
        const drivers = await Driver.find({
          vehicle_type: (delivery as any).vehicle,
        });
        await Promise.all(
          drivers.map(async (d) => {
            try {
              const driverId = String((d as any)._id);
              const driverSocket = await get_driver_socket_id(driverId);
              if (driverSocket) {
                io.to(driverSocket).emit("delivery_request", {
                  delivery_id: delivery._id,
                  msg: "Retrying delivery request",
                });
              } else {
                const tokens = await get_driver_push_tokens(driverId);
                if (tokens.length) {
                  await sendExpoPush(
                    tokens,
                    "New delivery request",
                    "A nearby sender needs a delivery",
                    {
                      type: "delivery_request",
                      deliveryId: delivery._id,
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
        io.emit("delivery_request", {
          delivery_id: delivery._id,
          msg: "Retrying delivery request",
        });
      }
    } catch (notifyErr) {
      console.error("Error notifying drivers for delivery retry:", notifyErr);
      // fallback to global emit
      io.emit("delivery_request", {
        delivery_id: delivery._id,
        msg: "Retrying delivery request",
      });
    }

    setTimeout(
      () => expire_delivery(delivery._id as string, delivery.sender.toString()),
      30000
    );

    res.status(200).json({ msg: "Retrying delivery request...", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Failed to retry delivery", err: err.message });
  }
};

export const rebook_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    if (!delivery_id)
      return res.status(400).json({ msg: "delivery_id required" });

    const delivery = await Delivery.findById(delivery_id);
    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    const new_delivery = await Delivery.create({
      sender: delivery.sender,
      pickup: delivery.pickup,
      dropoff: delivery.dropoff,
      to: delivery.to || undefined,
      package: delivery.package,
      fare: delivery.fare,
      distance_km: (delivery as any).distance_km,
      duration_mins: (delivery as any).duration_mins,
      vehicle: delivery.vehicle,
      driver_earnings: delivery.driver_earnings,
      commission: delivery.commission,
      status: "pending",
      scheduled: false,
    });

    // Notify drivers: if a vehicle type was specified for the rebooked delivery, only notify drivers of that type
    try {
      if ((new_delivery as any).vehicle) {
        const drivers = await Driver.find({
          vehicle_type: (new_delivery as any).vehicle,
        });
        await Promise.all(
          drivers.map(async (d) => {
            try {
              const driverId = String((d as any)._id);
              const driverSocket = await get_driver_socket_id(driverId);
              if (driverSocket) {
                io.to(driverSocket).emit("delivery_request", {
                  delivery_id: new_delivery._id,
                  msg: "Delivery rebooked",
                });
              } else {
                const tokens = await get_driver_push_tokens(driverId);
                if (tokens.length) {
                  await sendExpoPush(
                    tokens,
                    "New delivery request",
                    "A nearby sender needs a delivery",
                    {
                      type: "delivery_request",
                      deliveryId: new_delivery._id,
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
        io.emit("delivery_request", {
          delivery_id: new_delivery._id,
          msg: "Delivery rebooked",
        });
      }
    } catch (notifyErr) {
      console.error("Error notifying drivers for delivery rebook:", notifyErr);
      // fallback to global emit
      io.emit("delivery_request", {
        delivery_id: new_delivery._id,
        msg: "Delivery rebooked",
      });
    }

    setTimeout(
      () =>
        expire_delivery(
          new_delivery._id as string,
          new_delivery.sender.toString()
        ),
      30000
    );

    res
      .status(201)
      .json({ msg: "Delivery has been rebooked", delivery: new_delivery });
  } catch (err: any) {
    res
      .status(500)
      .json({ msg: "Failed to rebook delivery", err: err.message });
  }
};

export const get_available_deliveries = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const deliveries = await Delivery.find({
      status: "pending",
      driver: { $exists: false },
    });
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_delivery_data = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    const delivery = await Delivery.findById(delivery_id)
      .populate("sender", "name phone profile_pic")
      .populate({
        path: "driver",
        populate: { path: "user", select: "name phone profile_pic" },
      });
    res.status(200).json({ msg: "success", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_deliveries = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const { status } = req.query;
    const queryObj: any = { sender: user_id };
    if (status) queryObj.status = status as string;
    const deliveries = await Delivery.find(queryObj)
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
      .populate("sender", "name phone profile_pic");
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_in_transit_deliveries = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const deliveries = await Delivery.find({
      sender: user_id,
      status: "in_transit",
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
      .populate("sender", "name phone profile_pic");
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};
export const get_user_cancelled_deliveries = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const deliveries = await Delivery.find({
      sender: user_id,
      status: "cancelled",
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
      .populate("sender", "name phone profile_pic");
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};
export const get_user_delivered_deliveries = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const deliveries = await Delivery.find({
      sender: user_id,
      status: "cancelled",
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
      .populate("sender", "name phone profile_pic");
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_active_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const delivery = await Delivery.findOne({
      sender: user_id,
      status: {
        $in: [
          "pending",
          "accepted",
          "picked_up",
          "arrived",
          "in_transit",
          "expired",
        ],
      },
    })
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name email phone profile_pic",
        },
      })
      .populate("sender", "name phone profile_pic")
      .sort({ createdAt: -1 });
    res.status(200).json({ msg: "success", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const accept_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    const driver_id = await get_driver_id(req.user?.id!);

    const delivery = await Delivery.findOneAndUpdate(
      {
        _id: delivery_id,
        status: { $in: ["pending", "scheduled"] },
        driver: { $exists: false },
      },
      { driver: driver_id, status: "accepted" },
      { new: true }
    );

    if (!delivery)
      return res.status(400).json({ msg: "Could not accept delivery" });

    const sender_socket = await get_user_socket_id(delivery.sender!.toString());
    if (sender_socket)
      io.to(sender_socket).emit("delivery_accepted", {
        delivery_id,
        driver_id,
      });

    // Notify all drivers that this delivery has been taken so they drop the card
    io.emit("delivery_taken", { delivery_id });

    delivery.timestamps = {
      ...(delivery.timestamps as any),
      accepted_at: new Date(),
    } as any;
    await delivery.save();

    res.status(200).json({ msg: "Delivery accepted successfully", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const cancel_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    const { reason, by } = req.body;
    const delivery = await Delivery.findById(delivery_id);
    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    if (["delivered", "in_transit"].includes(delivery.status))
      return res.status(400).json({ msg: "Cannot cancel at this stage" });

    const user_socket = await get_user_socket_id(delivery.sender!.toString());
    const driver_socket = delivery.driver
      ? await get_driver_socket_id(delivery.driver!.toString())
      : null;
    if (user_socket)
      io.to(user_socket).emit("delivery_cancel", { reason, by, delivery_id });
    if (driver_socket)
      io.to(driver_socket).emit("delivery_cancel", { reason, by, delivery_id });

    delivery.status = "cancelled" as any;
    delivery.timestamps = {
      ...(delivery.timestamps as any),
      cancelled_at: new Date(),
    } as any;
    delivery.cancelled = { by, reason } as any;
    await delivery.save();

    res.status(200).json({ msg: "Delivery cancelled successfully.", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error.", error: err });
  }
};

export const update_delivery_status = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    const { status } = req.body;
    const driver_id = await get_driver_id(req.user?.id!);
    if (!status) return res.status(400).json({ msg: "Status required" });

    const delivery = await Delivery.findOne({
      _id: delivery_id,
      driver: driver_id,
    });
    if (!delivery)
      return res
        .status(404)
        .json({ msg: "Delivery not found or not assigned to you" });

    const sender_socket = await get_user_socket_id(delivery.sender!.toString());

    switch (status) {
      case "arrived":
        // Only allow marking as arrived when delivery was accepted
        if (delivery.status !== "accepted") {
          return res.status(400).json({
            msg: "Delivery must be 'accepted' before driver can mark as arrived",
          });
        }

        delivery.status = "arrived" as any;
        delivery.timestamps = {
          ...(delivery.timestamps as any),
          arrived_at: new Date(),
        } as any;
        if (sender_socket)
          io.to(sender_socket).emit("delivery_arrived", { delivery_id });
        break;

      case "picked_up":
        // Only allow marking as picked_up when delivery was accepted
        if (delivery.status !== "arrived") {
          return res.status(400).json({
            msg: "Dispatch rider must arrive first before it can be picked up",
          });
        }

        // Prevent pickup if payment not completed
        if ((delivery as any).payment_status !== "paid") {
          return res.status(400).json({
            msg: "Payment must be completed before package can be picked up",
          });
        }

        delivery.status = "picked_up" as any;
        delivery.timestamps = {
          ...(delivery.timestamps as any),
          picked_up_at: new Date(),
        } as any;
        if (sender_socket)
          io.to(sender_socket).emit("delivery_picked_up", { delivery_id });
        break;

      case "in_transit":
        // Only allow starting transit when package was picked up
        if (delivery.status !== "picked_up") {
          return res.status(400).json({
            msg: "Delivery must be 'picked_up' before starting transit",
          });
        }

        // Prevent transit start if payment not completed
        if ((delivery as any).payment_status !== "paid") {
          return res.status(400).json({
            msg: "Payment must be completed before transit can start",
          });
        }

        delivery.status = "in_transit" as any;
        delivery.timestamps = {
          ...(delivery.timestamps as any),
          in_transit_at: new Date(),
        } as any;
        if (sender_socket)
          io.to(sender_socket).emit("delivery_in_transit", { delivery_id });
        break;

      case "delivered":
        // Only allow delivered when currently in transit
        if (delivery.status !== "in_transit") {
          return res.status(400).json({
            msg: "Delivery must be 'in_transit' before it can be marked delivered",
          });
        }

        // set delivered timestamp
        delivery.timestamps = {
          ...(delivery.timestamps as any),
          delivered_at: new Date(),
        } as any;

        // attempt to complete delivery (credit driver, record commission, etc.)
        const result = await complete_delivery(delivery as any);
        if (!result.success) {
          return res
            .status(result.statusCode || 500)
            .json({ msg: result.message });
        }

        // notify sender that delivery completed
        if (sender_socket) {
          io.to(sender_socket).emit("delivery_completed", { delivery_id });
          await Activity.create({
            type: "delivery",
            user: delivery.sender,
            title: "Delivery completed",
            message: `Your delivery to ${delivery.dropoff.address} has been delivered`,
            metadata: { delivery_id: delivery._id, driver_id: delivery.driver },
          });
        }

        break;
      default:
        return res.status(400).json({ msg: "Invalid status" });
    }

    await delivery.save();
    res
      .status(200)
      .json({ msg: "Delivery status updated successfully", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const pay_for_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { delivery_id } = req.query;
    const user_id = req.user?.id;
    const delivery = await Delivery.findById(delivery_id);
    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    // simple wallet flow similar to rides (reuse wallet utils if present)
    const wallet = await (
      await import("../models/wallet")
    ).default.findOne({ owner_id: user_id });
    if (!wallet) return res.status(400).json({ msg: "No wallet" });

    const debit_wallet = (await import("../utils/wallet")).debit_wallet;

    const transaction = await debit_wallet({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount: delivery.fare,
      type: "payment",
      channel: "wallet",
      ride_id: new Types.ObjectId(delivery._id as string),
      reference: (
        await import("../utils/gen_unique_ref")
      ).generate_unique_reference(),
      metadata: { for: "delivery_payment" },
    });

    delivery.payment_status = "paid" as any;
    delivery.payment_method = "wallet" as any;
    await delivery.save();

    // Notify the assigned driver that payment succeeded
    if (delivery.driver) {
      const driver_socket = await get_driver_socket_id(
        delivery.driver.toString()
      );
      if (driver_socket) {
        io.to(driver_socket).emit("delivery_paid", { delivery_id });
      }
    }

    res.status(200).json({ msg: "Payment successful", transaction });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ msg: "Failed to pay for delivery", err: err.message });
  }
};

export const get_driver_active_delivery = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const delivery = await Delivery.findOne({
      driver: driver_id,
      status: { $in: ["accepted", "arrived", "picked_up", "in_transit"] },
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
      .populate("sender", "name phone profile_pic");

    res.status(200).json({ msg: "success", delivery });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

// --- Admin functions for deliveries ---

export const admin_get_deliveries = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const status = req.query.status as string | undefined;
    const filter: any = {};
    if (status) filter.status = status;

    const [total, deliveries] = await Promise.all([
      (await import("../models/delivery")).default.countDocuments(filter),
      (
        await import("../models/delivery")
      ).default
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sender", "name phone")
        .populate({
          path: "driver",
          select: "user vehicle_type vehicle",
          populate: { path: "user", select: "name phone" },
        }),
    ]);

    const pages = Math.ceil(total / limit);
    return res
      .status(200)
      .json({ msg: "success", deliveries, total, page, pages });
  } catch (err) {
    console.error("admin_get_deliveries error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const admin_get_delivery = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(
      req.query.id ||
        req.query.delivery_id ||
        req.query.deliveryId ||
        req.body?.id ||
        ""
    );
    if (!id) return res.status(400).json({ msg: "id is required" });

    const delivery = await (
      await import("../models/delivery")
    ).default
      .findById(id)
      .populate("sender", "name phone profile_pic")
      .populate({
        path: "driver",
        populate: { path: "user", select: "name phone profile_pic" },
      });

    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    let transactionsCount = 0;
    let activitiesCount = 0;
    try {
      const transactionModel = (await import("../models/transaction")).default;
      transactionsCount = await transactionModel.countDocuments({
        ride_id: delivery._id,
      } as any);
    } catch (e) {
      // ignore
    }

    try {
      activitiesCount = await Activity.countDocuments({
        "metadata.delivery_id": delivery._id,
      } as any);
    } catch (e) {
      // ignore
    }

    return res
      .status(200)
      .json({ msg: "success", delivery, transactionsCount, activitiesCount });
  } catch (err) {
    console.error("admin_get_delivery error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const admin_cancel_delivery = async (req: Request, res: Response) => {
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

    const deliveryModel = (await import("../models/delivery")).default;
    const delivery = await deliveryModel.findById(id);
    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    // Only allow admin to cancel deliveries in transit (mirror ride ongoing)
    if (delivery.status !== "in_transit") {
      return res
        .status(400)
        .json({ msg: "Only in_transit deliveries can be cancelled by admin" });
    }

    const senderSocket = await get_user_socket_id(delivery.sender!.toString());
    const driverSocket = delivery.driver
      ? await get_driver_socket_id(delivery.driver!.toString())
      : null;
    if (senderSocket)
      io.to(senderSocket).emit("delivery_cancel", {
        reason,
        by: "admin",
        delivery_id: id,
      });
    if (driverSocket)
      io.to(driverSocket).emit("delivery_cancel", {
        reason,
        by: "admin",
        delivery_id: id,
      });

    delivery.status = "cancelled" as any;
    delivery.timestamps = {
      ...(delivery.timestamps as any),
      cancelled_at: new Date(),
    } as any;
    delivery.cancelled = { by: "admin", reason } as any;
    await delivery.save();

    try {
      const senderTokens = delivery?.sender
        ? await get_user_push_tokens(delivery.sender!.toString())
        : [];
      const driverTokens = delivery?.driver
        ? await get_driver_push_tokens(delivery.driver!.toString())
        : [];

      if (senderTokens.length) {
        await sendExpoPush(senderTokens, "Delivery cancelled", reason, {
          type: "delivery_cancelled",
          deliveryId: delivery._id,
          by: "admin",
        });
      }
      if (driverTokens.length) {
        await sendExpoPush(driverTokens, "Delivery cancelled", reason, {
          type: "delivery_cancelled",
          deliveryId: delivery._id,
          by: "admin",
        });
      }
    } catch (e) {
      console.error(
        "Failed to send cancel push notifications for admin cancel:",
        e
      );
    }

    return res
      .status(200)
      .json({ msg: "Delivery cancelled by admin", delivery });
  } catch (err) {
    console.error("admin_cancel_delivery error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

export const admin_delete_delivery = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const deliveryModel = (await import("../models/delivery")).default;
    const delivery = await deliveryModel.findById(id);
    if (!delivery) return res.status(404).json({ msg: "Delivery not found" });

    // delete related transactions (best-effort)
    try {
      await (
        await import("../models/transaction")
      ).default.deleteMany({ ride_id: delivery._id } as any);
    } catch (e) {
      // ignore
    }

    // delete activities related to this delivery
    try {
      await Activity.deleteMany({
        "metadata.delivery_id": delivery._id,
      } as any);
    } catch (e) {
      // ignore
    }

    await deliveryModel.deleteOne({ _id: delivery._id });

    return res.status(200).json({ msg: "Delivery and related data deleted" });
  } catch (err) {
    console.error("admin_delete_delivery error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
