"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agenda = void 0;
const agenda_1 = __importDefault(require("agenda"));
const mongoConnectionString = process.env.MONGO_URI;
const ride_1 = __importDefault(require("../models/ride"));
const driver_1 = __importDefault(require("../models/driver"));
const expo_push_1 = require("../utils/expo_push");
const get_id_1 = require("../utils/get_id");
const ride_2 = require("../controllers/ride");
const server_1 = require("../server");
// Connect to Mongo and specify the collection "agendaJobs"
exports.agenda = new agenda_1.default({
    db: { address: mongoConnectionString, collection: "agendaJobs" },
});
// Add this helper constant to avoid magic numbers
const MAX_RETRIES = 5; // 5 retries * 30 secs = 2.5 minutes total search time
const RETRY_INTERVAL = "30 seconds";
// 1. THE NEW "RETRY" JOB
exports.agenda.define("retry_ride_search", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { ride_id, vehicle, attempt } = job.attrs.data;
    // A. Check if the ride is still valid and pending
    const ride = yield ride_1.default.findById(ride_id);
    // If ride is deleted, accepted, or cancelled, STOP searching.
    if (!ride || ride.status !== "pending") {
        return;
    }
    // B. Check if we have exceeded max retries (Stop Condition)
    if (attempt > MAX_RETRIES) {
        console.log(`Ride ${ride_id} expired after ${attempt} attempts.`);
        // Trigger your expiration logic
        yield (0, ride_2.expire_ride)(ride_id, ride.rider.toString());
        // Optional: Notify user "No drivers found"
        yield (0, expo_push_1.sendNotification)([ride.rider.toString()], "No Drivers Found", "We could not find a driver. Please try again.", { type: "ride_expired" });
        return;
    }
    console.log(`Retrying search for ride ${ride_id}. Attempt ${attempt}/${MAX_RETRIES}`);
    // C. THE LOGIC: Find drivers (This catches NEW drivers who just came online)
    // (Using your global search for testing as requested)
    const drivers = yield driver_1.default.find({ vehicle_type: vehicle }); // Add { is_busy: false } here ideally
    // Broadcast again
    yield Promise.all(drivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const driverId = String(d._id);
            const driverSocket = yield (0, get_id_1.get_driver_socket_id)(driverId);
            if (driverSocket) {
                server_1.io.to(driverSocket).emit("new_ride_request", { ride_id });
            }
        }
        catch (e) {
            console.error("Failed to notify driver on retry", d._id, e);
        }
    })));
    // D. RECURSION: Schedule the NEXT check
    yield exports.agenda.schedule(RETRY_INTERVAL, "retry_ride_search", {
        ride_id,
        vehicle,
        attempt: attempt + 1, // Increment attempt
    });
}));
// Define the jobs (What should happen?)
exports.agenda.define("send_ride_reminder", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { ride_id, user } = job.attrs.data;
    const ride = yield ride_1.default.findById(ride_id);
    if (ride) {
        yield (0, expo_push_1.sendNotification)([user], "Scheduled ride reminder ⏰", `Your ride from ${ride.pickup.address} to ${ride.destination.address} would be active in the next 10 mins, please make your self available at the pickup.`, { type: "ride_schedule_reminder" });
    }
}));
exports.agenda.define("enable_scheduled_ride", (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { ride_id, user, driver, vehicle } = job.attrs.data;
    const assigned_driver = yield driver_1.default.findById(driver);
    if (assigned_driver === null || assigned_driver === void 0 ? void 0 : assigned_driver.is_busy) {
        yield ride_1.default.findByIdAndUpdate(ride_id, {
            scheduled: false,
            driver: null,
            status: "pending",
        });
        yield (0, expo_push_1.sendNotification)([user], "Driver Busy - Searching...", "Your preferred driver is busy. We are finding you a new driver nearby.", { type: "ride_searching" });
        const drivers = yield driver_1.default.find({ vehicle_type: vehicle });
        // notify connected drivers via sockets and offline via push
        yield Promise.all(drivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const driverId = String(d._id);
                const driverSocket = yield (0, get_id_1.get_driver_socket_id)(driverId);
                if (driverSocket) {
                    server_1.io.to(driverSocket).emit("new_ride_request", {
                        ride_id,
                    });
                }
            }
            catch (e) {
                console.error("Failed to notify driver", d._id, e);
            }
        })));
        yield exports.agenda.schedule(RETRY_INTERVAL, "retry_ride_search", {
            ride_id,
            vehicle,
            attempt: 1, // Start count
        });
    }
    else {
        const ride = yield ride_1.default.findByIdAndUpdate(ride_id, { scheduled: false }, { new: true });
        yield driver_1.default.findByIdAndUpdate(driver, { is_busy: true });
        if (ride) {
            yield (0, expo_push_1.sendNotification)([user], "Scheduled ride is now active!", `Your ride from ${ride.pickup.address} to ${ride.destination.address} is now active, the driver should be on his way.`, { type: "ride_schedule_active" });
            yield (0, expo_push_1.sendNotification)([driver], "Scheduled ride is now active!", `Your ride to ${ride.destination.address} is now active, start heading to from ${ride.pickup.address}.`, { type: "ride_schedule_active", role: "driver" });
        }
    }
}));
