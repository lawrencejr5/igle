import Agenda, { Job } from "agenda";
const mongoConnectionString = process.env.MONGO_URI;

import Ride from "../models/ride";
import Driver from "../models/driver";

import { sendNotification } from "../utils/expo_push";
import { get_driver_socket_id } from "../utils/get_id";

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
      { type: "ride_schedule_reminder" }
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
      "Your preferred driver is busy. We are finding you a new driver nearby.",
      { type: "ride_searching" }
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

    if (ride) {
      await sendNotification(
        [user],
        "Scheduled ride is now active!",
        `Your ride from ${ride.pickup.address} to ${ride.destination.address} 
          is now active, the driver should be on his way.`,
        { type: "ride_schedule_active" }
      );
      await sendNotification(
        [driver],
        "Scheduled ride is now active!",
        `Your ride to ${ride.destination.address} is now active, start heading to from ${ride.pickup.address}.`,
        { type: "ride_schedule_active", role: "driver" }
      );
    }
  }
});
