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
exports.pay_for_ride = exports.update_ride_status = exports.cancel_ride = exports.accept_ride = exports.get_user_active_ride = exports.get_user_rides = exports.get_ride_data = exports.get_available_rides = exports.rebook_ride = exports.retry_ride = exports.request_ride = void 0;
const mongoose_1 = require("mongoose");
const ride_1 = __importDefault(require("../models/ride"));
const wallet_1 = __importDefault(require("../models/wallet"));
const get_id_1 = require("../utils/get_id");
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const wallet_2 = require("../utils/wallet");
const calc_fare_1 = require("../utils/calc_fare");
const calc_commision_1 = require("../utils/calc_commision");
const complete_ride_1 = require("../utils/complete_ride");
const server_1 = require("../server");
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
const request_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { km, min, scheduled_time } = req.query;
        const { pickup, destination } = req.body;
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
        const fare = (0, calc_fare_1.calculate_fare)(distance_km, duration_mins);
        const commission = (0, calc_commision_1.calculate_commission)(fare);
        const driver_earnings = fare - commission;
        const new_ride = yield ride_1.default.create({
            rider: user_id,
            pickup,
            destination,
            fare,
            distance_km,
            duration_mins,
            driver_earnings,
            commission,
            status: scheduled_time ? "scheduled" : "pending",
            scheduled_time: scheduled_time
                ? new Date(scheduled_time)
                : null,
        });
        // If it's an instant ride → emit immediately
        if (!scheduled_time) {
            server_1.io.emit("new_ride_request", { ride_id: new_ride._id });
            // Start expiration timeout
            setTimeout(() => expire_ride(new_ride._id, new_ride.rider.toString()), 90000);
        }
        res.status(201).json({
            msg: scheduled_time ? "Scheduled ride created" : "Ride request created",
            ride: new_ride,
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
        server_1.io.emit("new_ride_request", { ride_id: ride._id });
        res.status(200).json({
            msg: "Retrying ride request...",
            ride,
        });
        // Start expiration timeout
        setTimeout(() => expire_ride(ride._id, ride.rider.toString()), 90000);
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
        server_1.io.emit("new_ride_request", { ride_id: new_ride._id });
        res.status(201).json({
            msg: "Ride has been rebooked",
            ride: new_ride,
        });
        // Start expiration timeout
        setTimeout(() => expire_ride(new_ride._id, new_ride.rider.toString()), 90000);
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
            select: "user vehicle_type vehicle current_location",
            populate: {
                path: "user",
                select: "name email phone",
            },
        })
            .populate("rider", "name phone");
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
            select: "user vehicle_type vehicle current_location",
            populate: {
                path: "user",
                select: "name email phone",
            },
        })
            .populate("rider", "name phone");
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
            status: { $in: ["pending", "accepted", "ongoing", "arrived", "expired"] },
        })
            .sort({ createdAt: -1 })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location",
            populate: {
                path: "user",
                select: "name email phone",
            },
        })
            .populate("rider", "name phone");
        res.status(200).json({ msg: "success", ride });
    }
    catch (error) {
        res.status(500).json({ msg: "An error occurred while fetching ride" });
    }
});
exports.get_user_active_ride = get_user_active_ride;
// Accept a ride (assign driver and update status)
const accept_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { ride_id } = req.query;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const ride = yield ride_1.default.findOneAndUpdate({
            _id: ride_id,
            status: { $in: ["pending", "scheduled"] },
            driver: { $exists: false },
        }, { driver: driver_id, status: "accepted" }, { new: true });
        const rider_socket_id = yield (0, get_id_1.get_user_socket_id)(ride === null || ride === void 0 ? void 0 : ride.rider);
        const rider_socket = server_1.io.sockets.sockets.get(rider_socket_id);
        if (rider_socket) {
            server_1.io.to(rider_socket_id).emit("ride_accepted", {
                ride_id,
                driver_id,
                rider_socket_id,
            });
        }
        else {
            console.log("socket not found");
        }
        server_1.io.emit("ride_taken", {
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
        yield ride.save();
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
                if (user_socket)
                    server_1.io.to(user_socket).emit("ride_in_progress", {
                        msg: "Your ride has arrived",
                    });
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
                const result = yield (0, complete_ride_1.complete_ride)(ride);
                // Emitting ride status
                if (user_socket)
                    server_1.io.to(user_socket).emit("ride_completed", {
                        msg: "Your ride has been completed",
                    });
                if (driver_socket)
                    server_1.io.to(driver_socket).emit("ride_completed", {
                        msg: "You have finished the ride",
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
    try {
        const { ride_id } = req.query;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const ride = yield ride_1.default.findById(ride_id);
        if (!ride) {
            return res.status(400).json({ msg: "Invalid ride or status" });
        }
        const wallet = yield wallet_1.default.findOne({ owner_id: user_id });
        if (!wallet)
            return res.status(404).json({ msg: "Wallet not found" });
        const transaction = yield (0, wallet_2.debit_wallet)({
            wallet_id: new mongoose_1.Types.ObjectId(wallet._id),
            amount: ride.fare,
            type: "payment",
            channel: "wallet",
            ride_id: new mongoose_1.Types.ObjectId(ride._id),
            reference: (0, gen_unique_ref_1.generate_unique_reference)(),
            metadata: { for: "ride_payment" },
        });
        ride.payment_status = "paid";
        ride.payment_method = "wallet";
        yield ride.save();
        res.status(200).json({ msg: "Payment successful", transaction });
    }
    catch (err) {
        console.error(err);
        if (err.message === "insufficient") {
            return res.status(400).json({ msg: "Insufficient wallet balance" });
        }
        if (err.message === "no_wallet") {
            return res.status(404).json({ msg: "Wallet not found" });
        }
        res.status(500).json({ msg: "Server error", err });
    }
});
exports.pay_for_ride = pay_for_ride;
