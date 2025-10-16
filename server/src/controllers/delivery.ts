import { Request, Response } from "express";
import Delivery from "../models/delivery";
import { calculate_commission } from "../utils/calc_commision";
import { io } from "../server";
import {
  get_user_socket_id,
  get_driver_socket_id,
  get_driver_id,
} from "../utils/get_id";
import { Types } from "mongoose";

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

    // notify drivers (simple emit, you may filter by vehicle type client-side)
    io.emit("delivery_request", {
      delivery_id: new_delivery._id,
      msg: "New delivery request",
    });

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

    io.emit("delivery_request", {
      delivery_id: delivery._id,
      msg: "Retrying delivery request",
    });

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

    io.emit("delivery_request", {
      delivery_id: new_delivery._id,
      msg: "Delivery rebooked",
    });

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
    const deliveries = await Delivery.find(queryObj).sort({ createdAt: -1 });
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (err: any) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_active_deliveries = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const user_id = req.user?.id;
    const deliveries = await Delivery.find({
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
    }).sort({ createdAt: -1 });
    res
      .status(200)
      .json({ msg: "success", rowCount: deliveries.length, deliveries });
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
      case "picked_up":
        // Only allow marking as picked_up when delivery was accepted
        if (delivery.status !== "accepted") {
          return res.status(400).json({
            msg: "Delivery must be 'accepted' before it can be picked up",
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

        delivery.status = "delivered" as any;
        delivery.timestamps = {
          ...(delivery.timestamps as any),
          delivered_at: new Date(),
        } as any;
        if (sender_socket)
          io.to(sender_socket).emit("delivery_completed", { delivery_id });
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

    res.status(200).json({ msg: "Payment successful", transaction });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ msg: "Failed to pay for delivery", err: err.message });
  }
};
