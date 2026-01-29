"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.admin_delete_ride = exports.admin_cancel_ride = exports.admin_get_ride = exports.admin_get_rides = exports.pay_for_ride = exports.update_ride_status = exports.cancel_ride = exports.accept_ride = exports.get_user_scheduled_rides = exports.get_user_ongoing_ride = exports.get_user_active_ride = exports.get_user_rides = exports.get_ride_data = exports.get_available_rides = exports.rebook_ride = exports.retry_ride = exports.request_ride = exports.expire_ride = void 0;
const ride_1 = __importDefault(require("../models/ride"));
const wallet_1 = __importDefault(require("../models/wallet"));
const activity_1 = __importDefault(require("../models/activity"));
const driver_1 = __importDefault(require("../models/driver"));
const get_id_1 = require("../utils/get_id");
const get_id_2 = require("../utils/get_id");
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const calc_fare_1 = require("../utils/calc_fare");
const calc_commision_1 = require("../utils/calc_commision");
const complete_ride_1 = require("../utils/complete_ride");
const server_1 = require("../server");
const agenda_1 = require("../jobs/agenda");
const expo_push_1 = require("../utils/expo_push");
const mongoose_1 = __importDefault(require("mongoose"));
const transaction_1 = __importDefault(require("../models/transaction"));
// 🔄 Helper: Expire a ride
const expire_ride = (ride_id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const ride = yield ride_1.default.findById(ride_id);
    if (!ride || !["pending", "scheduled"].includes(ride.status))
        return;
    ride.status = "expired";
    yield ride.save();
    // Notify rider
    if (user_id) {
        const user_socket = yield (0, get_id_1.get_user_socket_id)(user_id);
        if (user_socket) {
            server_1.io.to(user_socket).emit("ride_timeout", {
                ride_id,
                msg: "No drivers accepted your ride in time.",
            });
        }
    }
    // Notify drivers to ignore this ride request
    server_1.io.emit("ride_request_expired", {
        ride_id,
        msg: "This ride has expired",
    });
});
exports.expire_ride = expire_ride;
const request_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { km, min, scheduled_time } = req.query;
        const { pickup, destination, vehicle, fare } = req.body;
        if (!pickup ||
            !pickup.coordinates ||
            !destination ||
            !destination.coordinates) {
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
        const commission = (0, calc_commision_1.calculate_commission)(fare);
        const driver_earnings = fare - commission;
        const result = yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const activeRide = yield ride_1.default.findOne({
                rider: user_id,
                status: { $in: ["pending", "accepted", "arrived", "ongoing"] },
            });
            if (activeRide) {
                return { already_booked: true, ride: activeRide };
            }
            const ride = yield ride_1.default.create({
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
                    ? new Date(scheduled_time)
                    : null,
            });
            return { already_booked: false, ride };
        }));
        if (result.already_booked) {
            res
                .status(200)
                .json({ msg: "You have an active request", ride: result.ride });
            return;
        }
        try {
            // notify connected drivers via sockets and offline via push
            if (vehicle) {
                server_1.io.to(`drivers_${vehicle}`).emit("new_ride_request", {
                    ride_id: result.ride._id,
                });
            }
            else {
                server_1.io.emit("new_ride_request", { ride_id: result.ride._id });
            }
        }
        catch (notifyErr) {
            console.error("Error notifying drivers for ride request:", notifyErr);
            // fallback to global emit
            server_1.io.emit("new_ride_request", { ride_id: result.ride._id });
        }
        // Start expiration timeout
        setTimeout(() => (0, exports.expire_ride)(result.ride._id, result.ride.rider.toString()), 30000);
        res.status(201).json({
            msg: result.ride.scheduled_time
                ? "Scheduled ride created"
                : "Ride request created",
            ride: result.ride,
        });
    }
    catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to create ride request", err: err.message });
    }
});
exports.request_ride = request_ride;
const retry_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ride_id } = req.query;
        if (!ride_id) {
            res.status(400).json({ msg: "ride_id is required" });
            return;
        }
        const ride = yield ride_1.default.findById(ride_id);
        if (!ride) {
            res.status(404).json({ msg: "Ride not found" });
            return;
        }
        if (ride.status !== "expired") {
            res.status(400).json({ msg: "Only expired rides can be retried" });
            return;
        }
        if (ride.scheduled_time)
            ride.status = "scheduled";
        else
            ride.status = "pending";
        yield ride.save();
        // Notify only drivers of the ride's vehicle type when retrying
        try {
            if (ride.vehicle) {
                server_1.io.to(`drivers_${ride.vehicle}`).emit("new_ride_request", {
                    ride_id: ride._id,
                });
            }
            else {
                server_1.io.emit("new_ride_request", { ride_id: ride._id });
            }
        }
        catch (e) {
            console.error("Notify retry error:", e);
            server_1.io.emit("new_ride_request", { ride_id: ride._id });
        }
        res.status(200).json({
            msg: "Retrying ride request...",
            ride,
        });
        // Start expiration timeout
        setTimeout(() => (0, exports.expire_ride)(ride._id, ride.rider.toString()), 30000);
    }
    catch (err) {
        res.status(500).json({ msg: "Failed to retry ride", err: err.message });
    }
});
exports.retry_ride = retry_ride;
const rebook_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ride_id } = req.query;
        if (!ride_id) {
            res.status(400).json({ msg: "ride_id is required" });
            return;
        }
        const ride = yield ride_1.default.findById(ride_id);
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
        const fare = (0, calc_fare_1.calculate_fare)(distance_km, duration_mins);
        const commission = (0, calc_commision_1.calculate_commission)(fare);
        const driver_earnings = fare - commission;
        const new_ride = yield ride_1.default.create({
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
        // Notify only drivers of the ride's vehicle type when retrying
        try {
            if (new_ride.vehicle) {
                server_1.io.to(`drivers_${new_ride.vehicle}`).emit("new_ride_request", {
                    ride_id: new_ride._id,
                });
            }
            else {
                server_1.io.emit("new_ride_request", { ride_id: new_ride._id });
            }
        }
        catch (e) {
            console.error("Notify retry error:", e);
            server_1.io.emit("new_ride_request", { ride_id: ride._id });
        }
        res.status(201).json({
            msg: "Ride has been rebooked",
            ride: new_ride,
        });
        // Start expiration timeout
        setTimeout(() => (0, exports.expire_ride)(new_ride._id, new_ride.rider.toString()), 30000);
    }
    catch (err) {
        res.status(500).json({ msg: "Failed to rebook ride", err: err.message });
    }
});
exports.rebook_ride = rebook_ride;
// Get available rides (status: pending, no driver assigned)
const get_available_rides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rides = yield ride_1.default.find({
            status: "pending",
            driver: { $exists: false },
        });
        res.status(200).json({ msg: "success", rowCount: rides.length, rides });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_available_rides = get_available_rides;
// Get available rides (status: pending, no driver assigned)
const get_ride_data = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ride_id } = req.query;
        const ride = yield ride_1.default.findById(ride_id)
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("rider", "name phone profile_pic");
        res.status(200).json({ msg: "success", ride });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_ride_data = get_ride_data;
const get_user_rides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { status } = req.query;
        const queryObj = {};
        if (status)
            queryObj.status = status;
        const rides = yield ride_1.default.find(Object.assign({ rider: user_id }, queryObj))
            .sort({ createdAt: -1 })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("rider", "name phone profile_pic");
        res.status(200).json({ msg: "success", rowCount: rides.length, rides });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_rides = get_user_rides;
const get_user_active_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const ride = yield ride_1.default.findOne({
            rider: user_id,
            status: {
                $in: [
                    "pending",
                    "scheduled",
                    "accepted",
                    "ongoing",
                    "arrived",
                    "expired",
                ],
            },
        })
            .sort({ createdAt: -1 })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("rider", "name phone profile_pic");
        res.status(200).json({ msg: "success", ride });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occurred while fetching ride" });
    }
});
exports.get_user_active_ride = get_user_active_ride;
const get_user_ongoing_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const ride = yield ride_1.default.findOne({
            rider: user_id,
            status: "ongoing",
            scheduled: false,
        })
            .sort({ createdAt: -1 })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("rider", "name phone profile_pic");
        res.status(200).json({ msg: "success", ride });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occurred while fetching ride" });
    }
});
exports.get_user_ongoing_ride = get_user_ongoing_ride;
const get_user_scheduled_rides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const rides = yield ride_1.default.find({
            rider: user_id,
            status: { $in: ["pending", "accepted", "arrived", "expired"] },
            scheduled: true,
        })
            .sort({ createdAt: -1 })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("rider", "name phone profile_pic");
        res.status(200).json({ msg: "success", row_count: rides.length, rides });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occurred while fetching ride" });
    }
});
exports.get_user_scheduled_rides = get_user_scheduled_rides;
// Accept a ride (assign driver and update status)
const accept_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { ride_id } = req.query;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const ride = yield ride_1.default.findOneAndUpdate({
            _id: ride_id,
            status: { $in: ["pending", "scheduled"] },
            driver: null,
        }, {
            driver: driver_id,
            status: "accepted",
            "timestamps.accepted_at": new Date(), // <--- Add this here
        }, { new: true });
        if (!ride) {
            res.status(404).json({ msg: "Ride is no longer available." });
            return;
        }
        server_1.io.emit("ride_taken", {
            ride_id,
            msg: "This ride has been taken by another driver",
            driver_id,
        });
        yield driver_1.default.findByIdAndUpdate(driver_id, {
            is_busy: (ride === null || ride === void 0 ? void 0 : ride.scheduled) ? false : true,
        });
        const rider_socket_id = yield (0, get_id_1.get_user_socket_id)(ride === null || ride === void 0 ? void 0 : ride.rider);
        const rider_socket = server_1.io.sockets.sockets.get(rider_socket_id);
        if (rider_socket) {
            server_1.io.to(rider_socket_id).emit("ride_accepted", {
                ride_id,
                driver_id,
                rider_socket_id,
            });
        }
        if (ride === null || ride === void 0 ? void 0 : ride.scheduled_time) {
            // Calculate trigger time: e.g., 20 minutes BEFORE the scheduled time
            // so the system starts looking for drivers ahead of time.
            const reminder_time = new Date(new Date(ride === null || ride === void 0 ? void 0 : ride.scheduled_time).getTime() - 15 * 60000);
            const dispatch_time = new Date(new Date(ride === null || ride === void 0 ? void 0 : ride.scheduled_time).getTime() - 10 * 60000);
            // Pass the ride_id to the worker
            yield agenda_1.agenda.schedule(reminder_time, "send_ride_reminder", {
                ride_id,
                user: ride.rider,
            });
            yield agenda_1.agenda.schedule(dispatch_time, "enable_scheduled_ride", {
                ride_id,
                user: ride.rider,
                driver: driver_id,
                vehicle: ride.vehicle,
            });
        }
        // Send notification to rider regardless of socket connection
        if (ride && ride.rider) {
            yield (0, expo_push_1.sendNotification)([String(ride.rider)], `${ride.scheduled ? "Scheduled ride accepted" : "Driver on the way"}`, "A driver has accepted your ride", {
                type: "ride_booking",
                ride_id: ride._id,
            });
        }
        res.status(200).json({ msg: "Ride accepted successfully", ride });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.accept_ride = accept_ride;
// Ride cancellation by rider or driver
const cancel_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ride_id } = req.query;
        const { reason, by } = req.body;
        const ride = yield ride_1.default.findById(ride_id);
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
        yield driver_1.default.findByIdAndUpdate(ride.driver, { is_busy: false });
        // Emitting ride cancellation
        const user_socket = yield (0, get_id_1.get_user_socket_id)(ride.rider);
        const driver_socket = yield (0, get_id_1.get_driver_socket_id)(ride.driver);
        if (user_socket)
            server_1.io.to(user_socket).emit("ride_cancel", { reason, by, ride_id });
        if (driver_socket)
            server_1.io.to(driver_socket).emit("ride_cancel", { reason, by, ride_id });
        // Mark ride as cancelled
        ride.status = "cancelled";
        ride.timestamps = Object.assign(Object.assign({}, ride.timestamps), { cancelled_at: new Date() });
        ride.cancelled.by = by;
        if (reason)
            ride.cancelled.reason = reason;
        yield ride.save();
        // Send push notifications to rider and driver if not connected via socket
        try {
            const riderTokens = (ride === null || ride === void 0 ? void 0 : ride.rider)
                ? yield (0, get_id_2.get_user_push_tokens)(ride.rider)
                : [];
            const driverTokens = (ride === null || ride === void 0 ? void 0 : ride.driver)
                ? yield (0, get_id_2.get_driver_push_tokens)(ride.driver)
                : [];
            const driver_user_id = yield (0, get_id_1.get_driver_user_id)(ride.driver);
            // Send notification to rider if tokens exist
            if (riderTokens.length) {
                yield (0, expo_push_1.sendNotification)([String(ride.rider)], "Ride cancelled", `Ride to ${ride.destination.address} cancelled by ${by === "rider" ? "you" : "the driver"}`, {
                    type: "ride_cancelled",
                    ride_id: ride._id,
                });
            }
            // Send notification to driver if tokens exist
            if (driverTokens.length) {
                yield (0, expo_push_1.sendNotification)([String(driver_user_id)], "Ride cancelled", `Ride to ${ride.destination.address} cancelled by ${by === "driver" ? "you" : "rider"}`, {
                    type: "ride_cancelled",
                    ride_id: ride._id,
                    role: "driver",
                });
            }
        }
        catch (e) {
            console.error("Failed to send cancel push notifications:", e);
        }
        res.status(200).json({ msg: "Ride cancelled successfully.", ride });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error.", error: err });
        console.error(err);
    }
});
exports.cancel_ride = cancel_ride;
// Updating status
const update_ride_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { ride_id } = req.query;
        const { status } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!status) {
            res.status(404).json({ msg: "No status was provided" });
            return;
        }
        const ride = yield ride_1.default.findOne({
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
        const user_socket = yield (0, get_id_1.get_user_socket_id)(ride.rider);
        const driver_socket = yield (0, get_id_1.get_driver_socket_id)(ride.driver);
        const tokens = (ride === null || ride === void 0 ? void 0 : ride.rider) ? yield (0, get_id_2.get_user_push_tokens)(ride.rider) : [];
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
                    server_1.io.to(user_socket).emit("ride_arrival", {
                        msg: "Your ride has arrived",
                    });
                // Send notification regardless of socket connection
                try {
                    if (tokens.length) {
                        yield (0, expo_push_1.sendNotification)([String(ride.rider)], "Your ride has arrived", "Your driver has arrived at pickup.", {
                            type: "ride_booking",
                            ride_id: ride._id,
                        });
                    }
                }
                catch (e) {
                    console.error("Failed to send arrived push to rider:", e);
                }
                if (driver_socket)
                    server_1.io.to(driver_socket).emit("ride_arrival", {
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
                    server_1.io.to(user_socket).emit("ride_in_progress", {
                        msg: "Your ride has arrived",
                    });
                }
                // Send notification regardless of socket connection
                if (tokens.length) {
                    yield (0, expo_push_1.sendNotification)([String(ride.rider)], "Your ride has started", "Your driver has started the ride.", {
                        type: "ride_booking",
                        ride_id: ride._id,
                    });
                }
                if (driver_socket)
                    server_1.io.to(driver_socket).emit("ride_in_progress", {
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
                const driver = yield driver_1.default.findById(ride.driver);
                if (driver) {
                    driver.total_trips += 1;
                    yield driver.save();
                }
                const result = yield (0, complete_ride_1.complete_ride)(ride);
                // Emitting ride status
                if (user_socket)
                    server_1.io.to(user_socket).emit("ride_completed", {
                        msg: "Your ride has been completed",
                    });
                // Send notification regardless of socket connection
                try {
                    if (tokens.length) {
                        console.log("Sending 'Ride completed' push to tokens:", tokens);
                        const res = yield (0, expo_push_1.sendNotification)([String(ride.rider)], "Ride completed", `Your ride to ${ride.destination.address} has been completed`, {
                            type: "ride_completed",
                            ride_id: ride._id,
                        });
                    }
                }
                catch (e) {
                    console.error("Failed to send completed push to rider:", e);
                }
                if (driver_socket)
                    server_1.io.to(driver_socket).emit("ride_completed", {
                        msg: "You have finished the ride",
                    });
                yield activity_1.default.create({
                    type: "ride",
                    user: ride.rider,
                    title: "Ride completed",
                    message: `Your ride to ${ride.destination.address} has been completed`,
                    metadata: { ride_id: ride._id, driver_id: ride.driver },
                });
                if (!result.success) {
                    res.status(result.statusCode).json({ msg: result.message });
                    return;
                }
                break;
            // If status is not arrived, ongoing or completed
            default:
                res.status(400).json({ msg: "Invalid status update." });
                return;
        }
        yield ride.save();
        res.status(200).json({ msg: "Ride status updated successfully", ride });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_ride_status = update_ride_status;
const pay_for_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    try {
        const { ride_id } = req.query;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const result = yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const ride = yield ride_1.default.findById(ride_id);
            const wallet = yield wallet_1.default.findOne({ owner_id: user_id });
            if (!ride || !wallet)
                throw new Error("not_found");
            // 1. Graceful Idempotency Check (No throwing here!)
            if (ride.payment_status === "paid") {
                return { already_paid: true, ride };
            }
            // 2. Hard Error Check (User actually doesn't have money)
            if (wallet.balance < ride.fare)
                throw new Error("insufficient");
            // 3. The Money Move
            wallet.balance -= ride.fare;
            yield wallet.save();
            yield transaction_1.default.create([
                {
                    wallet_id: wallet._id,
                    amount: ride.fare,
                    type: "ride_payment",
                    status: "success",
                    reference: (0, gen_unique_ref_1.generate_unique_reference)(),
                    metadata: { ride_id: ride._id },
                },
            ]);
            ride.payment_status = "paid";
            ride.payment_method = "wallet";
            yield ride.save();
            return { already_paid: false, ride };
        }));
        // --- We are now outside the Transaction ---
        // 4. Handle the "Already Paid" case quietly
        if (result.already_paid) {
            return res.status(200).json({
                msg: "Ride already paid for. Safe travels!",
                ride: result.ride,
            });
        }
        // 5. Side Effects: Trigger these ONLY for the first successful payment
        const { ride } = result;
        // Socket Notification to Driver
        if (ride.driver) {
            const driver_socket = yield (0, get_id_1.get_driver_socket_id)(ride.driver.toString());
            if (driver_socket) {
                server_1.io.to(driver_socket).emit("paid_for_ride", { ride_id: ride._id });
            }
            // Push Notification logic
            const driver_user_id = yield (0, get_id_1.get_driver_user_id)(ride.driver);
            const driver_tokens = yield (0, get_id_2.get_driver_push_tokens)(ride.driver.toString());
            if (driver_tokens.length > 0) {
                yield (0, expo_push_1.sendNotification)([String(driver_user_id)], "Payment received", "Rider has paid!", { ride_id: ride._id });
            }
        }
        res.status(200).json({ msg: "Payment successful", ride });
    }
    catch (err) {
        if (err.message === "insufficient")
            return res.status(400).json({ msg: "Insufficient balance" });
        if (err.message === "not_found")
            return res.status(200).json({ msg: "Ride or wallet not found" });
        res.status(500).json({ msg: "Payment failed", error: err.message });
    }
    finally {
        session.endSession();
    }
});
exports.pay_for_ride = pay_for_ride;
// --- Admin functions (moved to bottom) ---
// Admin: fetch paginated rides with rider and driver populated
const admin_get_rides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const { status, search, dateFrom, dateTo } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
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
        let rides = yield ride_1.default.find(filter)
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
            rides = rides.filter((ride) => {
                var _a, _b, _c, _d, _e;
                const id = ride._id.toString().toLowerCase();
                const riderName = (((_a = ride.rider) === null || _a === void 0 ? void 0 : _a.name) || "").toLowerCase();
                const driverName = (((_c = (_b = ride.driver) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || "").toLowerCase();
                const pickupAddress = (((_d = ride.pickup) === null || _d === void 0 ? void 0 : _d.address) || "").toLowerCase();
                const destinationAddress = (((_e = ride.destination) === null || _e === void 0 ? void 0 : _e.address) || "").toLowerCase();
                const vehicle = (ride.vehicle || "").toLowerCase();
                const rideStatus = (ride.status || "").toLowerCase();
                return (id.includes(searchLower) ||
                    riderName.includes(searchLower) ||
                    driverName.includes(searchLower) ||
                    pickupAddress.includes(searchLower) ||
                    destinationAddress.includes(searchLower) ||
                    vehicle.includes(searchLower) ||
                    rideStatus.includes(searchLower));
            });
        }
        // Get total count and apply pagination
        const total = rides.length;
        const paginatedRides = rides.slice(skip, skip + limit);
        const pages = Math.ceil(total / limit);
        return res
            .status(200)
            .json({ msg: "success", rides: paginatedRides, total, page, pages });
    }
    catch (err) {
        console.error("admin_get_rides error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_rides = admin_get_rides;
// Admin: get single ride details (populate rider and driver, include related counts)
const admin_get_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id ||
            req.query.ride_id ||
            req.query.rideId ||
            ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) ||
            "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const ride = yield ride_1.default.findById(id)
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("rider", "name phone profile_pic");
        if (!ride)
            return res.status(404).json({ msg: "Ride not found" });
        // fetch related transactions and activities counts (quietly — non-blocking if model missing)
        let transactionsCount = 0;
        let activitiesCount = 0;
        try {
            const transactionModel = (yield Promise.resolve().then(() => __importStar(require("../models/transaction")))).default;
            transactionsCount = yield transactionModel.countDocuments({
                ride_id: ride._id,
            });
        }
        catch (e) {
            // ignore if transaction model not available
        }
        try {
            activitiesCount = yield activity_1.default.countDocuments({
                "metadata.ride_id": ride._id,
            });
        }
        catch (e) {
            // ignore
        }
        return res
            .status(200)
            .json({ msg: "success", ride, transactionsCount, activitiesCount });
    }
    catch (err) {
        console.error("admin_get_ride error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_ride = admin_get_ride;
// Admin: cancel an ongoing ride
const admin_cancel_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const reason = (req.query.reason ||
            ((_c = req.body) === null || _c === void 0 ? void 0 : _c.reason) ||
            "Cancelled by admin").toString();
        const ride = yield ride_1.default.findById(id);
        if (!ride)
            return res.status(404).json({ msg: "Ride not found" });
        if (ride.status !== "ongoing") {
            return res
                .status(400)
                .json({ msg: "Only ongoing rides can be cancelled by admin" });
        }
        // Notify rider and driver via sockets and push
        const user_socket = yield (0, get_id_1.get_user_socket_id)(ride.rider);
        const driver_socket = yield (0, get_id_1.get_driver_socket_id)(ride.driver);
        if (user_socket)
            server_1.io.to(user_socket).emit("ride_cancel", {
                reason,
                by: "admin",
                ride_id: id,
            });
        if (driver_socket)
            server_1.io.to(driver_socket).emit("ride_cancel", {
                reason,
                by: "admin",
                ride_id: id,
            });
        // set ride cancelled metadata
        ride.status = "cancelled";
        ride.timestamps = Object.assign(Object.assign({}, (ride.timestamps || {})), { cancelled_at: new Date() });
        ride.cancelled = { by: "admin", reason };
        yield ride.save();
        try {
            const riderTokens = (ride === null || ride === void 0 ? void 0 : ride.rider)
                ? yield (0, get_id_2.get_user_push_tokens)(ride.rider)
                : [];
            const driverTokens = (ride === null || ride === void 0 ? void 0 : ride.driver)
                ? yield (0, get_id_2.get_driver_push_tokens)(ride.driver)
                : [];
            const driver_user_id = (0, get_id_1.get_driver_user_id)(ride.driver);
            if (riderTokens.length) {
                yield (0, expo_push_1.sendNotification)([String(ride.rider)], "Ride cancelled", "Ride was cancelled by Igle", {
                    type: "ride_cancelled",
                    ride_id: ride._id,
                    by: "admin",
                });
            }
            if (driverTokens.length) {
                yield (0, expo_push_1.sendNotification)([String(driver_user_id)], "Ride cancelled", "Ride was cancelled by Igle", {
                    type: "ride_cancelled",
                    ride_id: ride._id,
                    by: "admin",
                    role: "driver",
                });
            }
        }
        catch (e) {
            console.error("Failed to send cancel push notifications:", e);
        }
        return res.status(200).json({ msg: "Ride cancelled by admin", ride });
    }
    catch (err) {
        console.error("admin_cancel_ride error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_cancel_ride = admin_cancel_ride;
// Admin: delete a ride and related data (transactions, activities)
const admin_delete_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const ride = yield ride_1.default.findById(id);
        if (!ride)
            return res.status(404).json({ msg: "Ride not found" });
        // delete related transactions
        try {
            yield wallet_1.default.deleteMany({}); // noop placeholder - keep wallets intact
        }
        catch (e) {
            // ignore
        }
        // delete transactions linked to this ride
        yield (yield Promise.resolve().then(() => __importStar(require("../models/transaction")))).default.deleteMany({ ride_id: ride._id });
        // delete activities related to this ride
        yield activity_1.default.deleteMany({ "metadata.ride_id": ride._id });
        // delete the ride itself
        yield ride_1.default.deleteOne({ _id: ride._id });
        return res.status(200).json({ msg: "Ride and related data deleted" });
    }
    catch (err) {
        console.error("admin_delete_ride error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_delete_ride = admin_delete_ride;
