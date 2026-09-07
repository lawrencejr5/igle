import Agenda, { Job } from "agenda";
const mongoConnectionString = process.env.MONGO_URI;

import Ride from "../models/ride";
import Driver from "../models/driver";
import FoodOrder from "../models/foodOrder";
import Restaurant from "../models/restaurant";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";

import { sendNotification } from "../utils/expo_push";
import { get_driver_socket_id, get_user_socket_id } from "../utils/get_id";
import { generate_unique_reference } from "../utils/gen_unique_ref";

import { expire_ride } from "../controllers/ride";

import { io } from "../server";

// Connect to Mongo and specify the collection "agendaJobs"
export const agenda = new Agenda({
  db: { address: mongoConnectionString!, collection: "agendaJobs" },
});

// Add this helper constant to avoid magic numbers
const MAX_RETRIES = 5; // 5 retries * 30 secs = 2.5 minutes total search time
const RETRY_INTERVAL = "30 seconds";

// 1. THE NEW "RETRY" JOB
agenda.define("retry_ride_search", async (job: Job) => {
  const { ride_id, vehicle, attempt } = job.attrs.data;

  // A. Check if the ride is still valid and pending
  const ride = await Ride.findById(ride_id);

  // If ride is deleted, accepted, or cancelled, STOP searching.
  if (!ride || ride.status !== "pending") {
    return;
  }

  // B. Check if we have exceeded max retries (Stop Condition)
  if (attempt > MAX_RETRIES) {
    console.log(`Ride ${ride_id} expired after ${attempt} attempts.`);
    // Trigger your expiration logic
    await expire_ride(ride_id, ride.rider.toString());
    // Optional: Notify user "No drivers found"
    await sendNotification(
      [ride.rider.toString()],
      "No Drivers Found",
      "We could not find a driver. Please try again.",
      { type: "ride_expired" }
    );
    return;
  }

  console.log(
    `Retrying search for ride ${ride_id}. Attempt ${attempt}/${MAX_RETRIES}`
  );

  // C. THE LOGIC: Find drivers (This catches NEW drivers who just came online)
  // (Using your global search for testing as requested)
  const drivers = await Driver.find({ vehicle_type: vehicle }); // Add { is_busy: false } here ideally

  // Broadcast again
  await Promise.all(
    drivers.map(async (d) => {
      try {
        const driverId = String((d as any)._id);
        const driverSocket = await get_driver_socket_id(driverId);
        if (driverSocket) {
          io.to(driverSocket).emit("new_ride_request", { ride_id });
        }
      } catch (e) {
        console.error("Failed to notify driver on retry", d._id, e);
      }
    })
  );

  // D. RECURSION: Schedule the NEXT check
  await agenda.schedule(RETRY_INTERVAL, "retry_ride_search", {
    ride_id,
    vehicle,
    attempt: attempt + 1, // Increment attempt
  });
});

// Define the jobs (What should happen?)
agenda.define("send_ride_reminder", async (job: Job) => {
  const { ride_id, user } = job.attrs.data;

  const ride = await Ride.findById(ride_id);
  if (ride) {
    await sendNotification(
      [user],
      "Scheduled ride reminder ⏰",
      `Your ride from ${ride.pickup.address} to ${ride.destination.address} would be active in the next 10 mins, please make your self available at the pickup.`,
      { type: "ride_booking" }
    );
  }
});

agenda.define("enable_scheduled_ride", async (job: Job) => {
  const { ride_id, user, driver, vehicle } = job.attrs.data;

  const assigned_driver = await Driver.findById(driver);
  if (assigned_driver?.is_busy) {
    await Ride.findByIdAndUpdate(ride_id, {
      scheduled: false,
      driver: null,
      status: "pending",
    });

    await sendNotification(
      [user],
      "Driver Busy - Searching...",
      "Your preferred driver is busy. We are trying to assign a new driver nearby to you.",
      { type: "ride_booking" }
    );

    const drivers = await Driver.find({ vehicle_type: vehicle });
    // notify connected drivers via sockets and offline via push
    await Promise.all(
      drivers.map(async (d) => {
        try {
          const driverId = String((d as any)._id);
          const driverSocket = await get_driver_socket_id(driverId);
          if (driverSocket) {
            io.to(driverSocket).emit("new_ride_request", {
              ride_id,
            });
          }
        } catch (e) {
          console.error("Failed to notify driver", d._id, e);
        }
      })
    );

    await agenda.schedule(RETRY_INTERVAL, "retry_ride_search", {
      ride_id,
      vehicle,
      attempt: 1, // Start count
    });
  } else {
    const ride = await Ride.findByIdAndUpdate(
      ride_id,
      { scheduled: false },
      { new: true }
    );

    await Driver.findByIdAndUpdate(driver, { is_busy: true });

    if (ride) {
      await sendNotification(
        [user],
        "Scheduled ride is now active!",
        `Your ride from ${ride.pickup.address} to ${ride.destination.address} is now active, the driver should be on his way.`,
        { type: "ride_booking" }
      );
      await sendNotification(
        [driver],
        "Scheduled ride is now active!",
        `Your ride to ${ride.destination.address} is now active, start heading to from ${ride.pickup.address}.`,
        { type: "ride_booking", role: "driver" }
      );
    }
  }
});

// 3. FOOD ORDER 3-MINUTE ACCEPTANCE TIMEOUT JOB
agenda.define("check_food_order_timeout", async (job: Job) => {
  const { order_id } = job.attrs.data;
  if (!order_id) return;

  const order = await FoodOrder.findById(order_id);

  // If order is still "placed" after 3 minutes (not accepted, preparing, or cancelled)
  if (order && order.status === "placed") {
    console.log(`Food order ${order_id} timed out after 3 minutes.`);
    order.status = "rejected";
    order.cancellation = {
      cancelled_by: "system",
      reason: "Restaurant did not accept order within 3 minutes timeout",
    };
    order.status_timestamps.cancelled_at = new Date();
    await order.save();

    // Refund customer's money back to in-app wallet
    const customerWallet = await Wallet.findOne({ owner_id: order.customer });
    if (customerWallet) {
      customerWallet.balance += order.pricing.total;
      await customerWallet.save();

      await Transaction.create({
        wallet_id: customerWallet._id,
        type: "payout",
        amount: order.pricing.total,
        status: "success",
        channel: "wallet",
        reference: generate_unique_reference(),
        metadata: {
          order_id: order._id,
          order_number: order.order_number,
          reason: "3-minute vendor response timeout refund",
        },
      });
    }

    // Socket notification to customer
    const customerSocket = await get_user_socket_id(order.customer);
    if (customerSocket) {
      io.to(customerSocket).emit("food_order_timeout", {
        order_id: order._id,
        order_number: order.order_number,
        msg: "The restaurant did not accept your order in time. Your payment has been refunded to your wallet.",
      });
    }

    // Notify room tracking
    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      status: "rejected",
      msg: "Order timed out and was cancelled.",
    });

    // Socket notification to vendor
    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant?.user) {
      const vendorSocket = await get_user_socket_id(restaurant.user);
      if (vendorSocket) {
        io.to(vendorSocket).emit("food_order_expired", {
          order_id: order._id,
          order_number: order.order_number,
          msg: "Order timed out due to no response in 3 minutes.",
        });
      }
    }

    // Push notification to customer
    await sendNotification(
      [order.customer.toString()],
      "Order Refunded 💳",
      `Restaurant did not respond in 3 mins. NGN ${order.pricing.total.toLocaleString()} has been refunded to your wallet.`,
      { type: "food_order_timeout", order_id: String(order._id) }
    );
  }
});
