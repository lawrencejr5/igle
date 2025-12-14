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
exports.admin_delete_delivery = exports.admin_cancel_delivery = exports.admin_get_delivery = exports.admin_get_deliveries = exports.get_driver_active_delivery = exports.pay_for_delivery = exports.update_delivery_status = exports.cancel_delivery = exports.accept_delivery = exports.get_user_active_delivery = exports.get_user_delivered_deliveries = exports.get_user_cancelled_deliveries = exports.get_user_in_transit_deliveries = exports.get_user_deliveries = exports.get_delivery_data = exports.get_available_deliveries = exports.rebook_delivery = exports.retry_delivery = exports.request_delivery = void 0;
const delivery_1 = __importDefault(require("../models/delivery"));
const driver_1 = __importDefault(require("../models/driver"));
const calc_commision_1 = require("../utils/calc_commision");
const server_1 = require("../server");
const get_id_1 = require("../utils/get_id");
const expo_push_1 = require("../utils/expo_push");
const complete_delivery_1 = require("../utils/complete_delivery");
const mongoose_1 = require("mongoose");
const activity_1 = __importDefault(require("../models/activity"));
// expire delivery helper
const expire_delivery = (delivery_id, user_id) => __awaiter(void 0, void 0, void 0, function* () {
    const delivery = yield delivery_1.default.findById(delivery_id);
    if (!delivery || !["pending", "scheduled"].includes(delivery.status))
        return;
    delivery.status = "expired";
    yield delivery.save();
    // Notify sender
    if (user_id) {
        const user_socket = yield (0, get_id_1.get_user_socket_id)(user_id);
        if (user_socket)
            server_1.io.to(user_socket).emit("delivery_timeout", { delivery_id });
    }
    // notify drivers to ignore
    server_1.io.emit("delivery_request_expired", {
        delivery_id,
        msg: "Delivery request expired",
    });
});
const request_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { km, min, scheduled_time } = req.query;
        // accept package info and optional from/to contact objects in the body
        const { pickup, dropoff, vehicle, fare, package_data, to } = req.body;
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
        const commission = (0, calc_commision_1.calculate_commission)(fareNum);
        const driver_earnings = fareNum - commission;
        const new_delivery = yield delivery_1.default.create({
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
                ? new Date(scheduled_time)
                : null,
        });
        // notify drivers. If a vehicle type was specified, only notify drivers of that type
        try {
            if (vehicle) {
                // find drivers with the requested vehicle type
                const drivers = yield driver_1.default.find({ vehicle_type: vehicle });
                // notify connected drivers via sockets and offline via push
                yield Promise.all(drivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const driverId = String(d._id);
                        const driverSocket = yield (0, get_id_1.get_driver_socket_id)(driverId);
                        if (driverSocket) {
                            server_1.io.to(driverSocket).emit("delivery_request", {
                                delivery_id: new_delivery._id,
                            });
                        }
                    }
                    catch (e) {
                        console.error("Failed to notify driver", d._id, e);
                    }
                })));
            }
            else {
                // fallback: notify all drivers
                server_1.io.emit("delivery_request", { delivery_id: new_delivery._id });
            }
        }
        catch (notifyErr) {
            console.error("Error notifying drivers for delivery request:", notifyErr);
            // fallback to global emit
            server_1.io.emit("delivery_request", { delivery_id: new_delivery._id });
        }
        // expiration timeout (30s similar to rides)
        setTimeout(() => expire_delivery(new_delivery._id, new_delivery.sender.toString()), 30000);
        res.status(201).json({
            msg: scheduled_time
                ? "Scheduled delivery created"
                : "Delivery request created",
            delivery: new_delivery,
        });
    }
    catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to create delivery", err: err.message });
    }
});
exports.request_delivery = request_delivery;
const retry_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { delivery_id } = req.query;
        if (!delivery_id)
            return res.status(400).json({ msg: "delivery_id required" });
        const delivery = yield delivery_1.default.findById(delivery_id);
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        if (delivery.status !== "expired")
            return res.status(400).json({ msg: "Delivery not expired" });
        delivery.status = delivery.scheduled_time ? "scheduled" : "pending";
        yield delivery.save();
        // Notify drivers: if a vehicle type was specified, only notify drivers of that type
        try {
            if (delivery.vehicle) {
                const drivers = yield driver_1.default.find({
                    vehicle_type: delivery.vehicle,
                });
                yield Promise.all(drivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const driverId = String(d._id);
                        const driverSocket = yield (0, get_id_1.get_driver_socket_id)(driverId);
                        if (driverSocket) {
                            server_1.io.to(driverSocket).emit("delivery_request", {
                                delivery_id: delivery._id,
                                msg: "Retrying delivery request",
                            });
                        }
                    }
                    catch (e) {
                        console.error("Failed to notify driver", d._id, e);
                    }
                })));
            }
            else {
                // fallback: notify all drivers
                server_1.io.emit("delivery_request", {
                    delivery_id: delivery._id,
                    msg: "Retrying delivery request",
                });
            }
        }
        catch (notifyErr) {
            console.error("Error notifying drivers for delivery retry:", notifyErr);
            // fallback to global emit
            server_1.io.emit("delivery_request", {
                delivery_id: delivery._id,
                msg: "Retrying delivery request",
            });
        }
        setTimeout(() => expire_delivery(delivery._id, delivery.sender.toString()), 30000);
        res.status(200).json({ msg: "Retrying delivery request...", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Failed to retry delivery", err: err.message });
    }
});
exports.retry_delivery = retry_delivery;
const rebook_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { delivery_id } = req.query;
        if (!delivery_id)
            return res.status(400).json({ msg: "delivery_id required" });
        const delivery = yield delivery_1.default.findById(delivery_id);
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        const new_delivery = yield delivery_1.default.create({
            sender: delivery.sender,
            pickup: delivery.pickup,
            dropoff: delivery.dropoff,
            to: delivery.to || undefined,
            package: delivery.package,
            fare: delivery.fare,
            distance_km: delivery.distance_km,
            duration_mins: delivery.duration_mins,
            vehicle: delivery.vehicle,
            driver_earnings: delivery.driver_earnings,
            commission: delivery.commission,
            status: "pending",
            scheduled: false,
        });
        // Notify drivers: if a vehicle type was specified for the rebooked delivery, only notify drivers of that type
        try {
            if (new_delivery.vehicle) {
                const drivers = yield driver_1.default.find({
                    vehicle_type: new_delivery.vehicle,
                });
                yield Promise.all(drivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
                    try {
                        const driverId = String(d._id);
                        const driverSocket = yield (0, get_id_1.get_driver_socket_id)(driverId);
                        if (driverSocket) {
                            server_1.io.to(driverSocket).emit("delivery_request", {
                                delivery_id: new_delivery._id,
                                msg: "Delivery rebooked",
                            });
                        }
                    }
                    catch (e) {
                        console.error("Failed to notify driver", d._id, e);
                    }
                })));
            }
            else {
                // fallback: notify all drivers
                server_1.io.emit("delivery_request", {
                    delivery_id: new_delivery._id,
                    msg: "Delivery rebooked",
                });
            }
        }
        catch (notifyErr) {
            console.error("Error notifying drivers for delivery rebook:", notifyErr);
            // fallback to global emit
            server_1.io.emit("delivery_request", {
                delivery_id: new_delivery._id,
                msg: "Delivery rebooked",
            });
        }
        setTimeout(() => expire_delivery(new_delivery._id, new_delivery.sender.toString()), 30000);
        res
            .status(201)
            .json({ msg: "Delivery has been rebooked", delivery: new_delivery });
    }
    catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to rebook delivery", err: err.message });
    }
});
exports.rebook_delivery = rebook_delivery;
const get_available_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deliveries = yield delivery_1.default.find({
            status: "pending",
            driver: { $exists: false },
        });
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_available_deliveries = get_available_deliveries;
const get_delivery_data = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { delivery_id } = req.query;
        const delivery = yield delivery_1.default.findById(delivery_id)
            .populate("sender", "name phone profile_pic")
            .populate({
            path: "driver",
            populate: { path: "user", select: "name phone profile_pic" },
        });
        res.status(200).json({ msg: "success", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_delivery_data = get_delivery_data;
const get_user_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { status } = req.query;
        const queryObj = { sender: user_id };
        if (status)
            queryObj.status = status;
        const deliveries = yield delivery_1.default.find(queryObj)
            .sort({ createdAt: -1 })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("sender", "name phone profile_pic");
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_deliveries = get_user_deliveries;
const get_user_in_transit_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const deliveries = yield delivery_1.default.find({
            sender: user_id,
            status: "in_transit",
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
            .populate("sender", "name phone profile_pic");
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_in_transit_deliveries = get_user_in_transit_deliveries;
const get_user_cancelled_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const deliveries = yield delivery_1.default.find({
            sender: user_id,
            status: "cancelled",
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
            .populate("sender", "name phone profile_pic");
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_cancelled_deliveries = get_user_cancelled_deliveries;
const get_user_delivered_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const deliveries = yield delivery_1.default.find({
            sender: user_id,
            status: "cancelled",
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
            .populate("sender", "name phone profile_pic");
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_delivered_deliveries = get_user_delivered_deliveries;
const get_user_active_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const delivery = yield delivery_1.default.findOne({
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
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        })
            .populate("sender", "name phone profile_pic")
            .sort({ createdAt: -1 });
        res.status(200).json({ msg: "success", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_active_delivery = get_user_active_delivery;
const accept_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { delivery_id } = req.query;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const delivery = yield delivery_1.default.findOneAndUpdate({
            _id: delivery_id,
            status: { $in: ["pending", "scheduled"] },
            driver: { $exists: false },
        }, { driver: driver_id, status: "accepted" }, { new: true });
        if (!delivery)
            return res.status(400).json({ msg: "Could not accept delivery" });
        const sender_socket = yield (0, get_id_1.get_user_socket_id)(delivery.sender.toString());
        if (sender_socket)
            server_1.io.to(sender_socket).emit("delivery_accepted", {
                delivery_id,
                driver_id,
            });
        const user_tokens = yield (0, get_id_1.get_user_push_tokens)(delivery.sender);
        if (user_tokens.length > 0)
            yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Delivery accepted", "A driver has accepted to deliver your package", {
                type: "delivery_booking",
                deliveryId: delivery._id,
            });
        // Notify all drivers that this delivery has been taken so they drop the card
        server_1.io.emit("delivery_taken", { delivery_id });
        delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { accepted_at: new Date() });
        yield delivery.save();
        res.status(200).json({ msg: "Delivery accepted successfully", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.accept_delivery = accept_delivery;
const cancel_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { delivery_id } = req.query;
        const { reason, by } = req.body;
        const delivery = yield delivery_1.default.findById(delivery_id);
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        if (["delivered", "in_transit"].includes(delivery.status))
            return res.status(400).json({ msg: "Cannot cancel at this stage" });
        const user_socket = yield (0, get_id_1.get_user_socket_id)(delivery.sender.toString());
        const driver_socket = delivery.driver
            ? yield (0, get_id_1.get_driver_socket_id)(delivery.driver.toString())
            : null;
        if (user_socket)
            server_1.io.to(user_socket).emit("delivery_cancel", { reason, by, delivery_id });
        if (driver_socket)
            server_1.io.to(driver_socket).emit("delivery_cancel", { reason, by, delivery_id });
        const user_tokens = yield (0, get_id_1.get_user_push_tokens)(delivery.sender);
        const driver_tokens = yield (0, get_id_1.get_driver_push_tokens)(String(delivery.driver));
        const driver_user_id = yield (0, get_id_1.get_driver_user_id)(String(delivery.driver));
        if (user_tokens.length > 0)
            yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Delivery cancelled", `Delivery was cancelled by ${delivery.cancelled.by === "sender" ? "you" : "the driver"}`, {
                type: "delivery_cancelled",
                deliveryId: delivery._id,
            });
        if (driver_tokens.length > 0)
            yield (0, expo_push_1.sendNotification)([String(driver_user_id)], "Delivery cancelled", `Delivery was cancelled by ${delivery.cancelled.by === "driver" ? "you" : "the sender"}`, {
                type: "delivery_cancelled",
                deliveryId: delivery._id,
                role: "driver",
            });
        delivery.status = "cancelled";
        delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { cancelled_at: new Date() });
        delivery.cancelled = { by, reason };
        yield delivery.save();
        res.status(200).json({ msg: "Delivery cancelled successfully.", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error.", error: err });
    }
});
exports.cancel_delivery = cancel_delivery;
const update_delivery_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { delivery_id } = req.query;
        const { status } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!status)
            return res.status(400).json({ msg: "Status required" });
        const delivery = yield delivery_1.default.findOne({
            _id: delivery_id,
            driver: driver_id,
        });
        if (!delivery)
            return res
                .status(404)
                .json({ msg: "Delivery not found or not assigned to you" });
        const sender_socket = yield (0, get_id_1.get_user_socket_id)(delivery.sender.toString());
        const user_tokens = yield (0, get_id_1.get_user_push_tokens)(delivery.sender);
        switch (status) {
            case "arrived":
                // Only allow marking as arrived when delivery was accepted
                if (delivery.status !== "accepted") {
                    return res.status(400).json({
                        msg: "Delivery must be 'accepted' before driver can mark as arrived",
                    });
                }
                if (user_tokens.length > 0)
                    yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Driver arrived", `Your driver has arrived`, {
                        type: "delivery_booking",
                        deliveryId: delivery._id,
                    });
                delivery.status = "arrived";
                delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { arrived_at: new Date() });
                if (sender_socket)
                    server_1.io.to(sender_socket).emit("delivery_arrived", { delivery_id });
                break;
            case "picked_up":
                // Only allow marking as picked_up when delivery was accepted
                if (delivery.status !== "arrived") {
                    return res.status(400).json({
                        msg: "Dispatch rider must arrive first before it can be picked up",
                    });
                }
                // Prevent pickup if payment not completed
                if (delivery.payment_status !== "paid") {
                    return res.status(400).json({
                        msg: "Payment must be completed before package can be picked up",
                    });
                }
                if (user_tokens.length > 0)
                    yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Delivery picked up", `Your driver has picked up your delivery`, {
                        type: "delivery_booking",
                        deliveryId: delivery._id,
                    });
                delivery.status = "picked_up";
                delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { picked_up_at: new Date() });
                if (sender_socket)
                    server_1.io.to(sender_socket).emit("delivery_picked_up", { delivery_id });
                break;
            case "in_transit":
                // Only allow starting transit when package was picked up
                if (delivery.status !== "picked_up") {
                    return res.status(400).json({
                        msg: "Delivery must be 'picked_up' before starting transit",
                    });
                }
                // Prevent transit start if payment not completed
                if (delivery.payment_status !== "paid") {
                    return res.status(400).json({
                        msg: "Payment must be completed before transit can start",
                    });
                }
                if (user_tokens.length > 0)
                    yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Delivery in transit", `Your delivery is on it's way to the receiver`, {
                        type: "delivery_booking",
                        deliveryId: delivery._id,
                    });
                delivery.status = "in_transit";
                delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { in_transit_at: new Date() });
                if (sender_socket)
                    server_1.io.to(sender_socket).emit("delivery_in_transit", { delivery_id });
                break;
            case "delivered":
                // Only allow delivered when currently in transit
                if (delivery.status !== "in_transit") {
                    return res.status(400).json({
                        msg: "Delivery must be 'in_transit' before it can be marked delivered",
                    });
                }
                // set delivered timestamp
                delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { delivered_at: new Date() });
                if (user_tokens.length > 0)
                    yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Delivery delivered", `Your delivery has been delivered`, {
                        type: "delivery_completed",
                        deliveryId: delivery._id,
                    });
                // attempt to complete delivery (credit driver, record commission, etc.)
                const result = yield (0, complete_delivery_1.complete_delivery)(delivery);
                if (!result.success) {
                    return res
                        .status(result.statusCode || 500)
                        .json({ msg: result.message });
                }
                // notify sender that delivery completed
                if (sender_socket) {
                    server_1.io.to(sender_socket).emit("delivery_completed", { delivery_id });
                    yield activity_1.default.create({
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
        yield delivery.save();
        res
            .status(200)
            .json({ msg: "Delivery status updated successfully", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_delivery_status = update_delivery_status;
const pay_for_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { delivery_id } = req.query;
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const delivery = yield delivery_1.default.findById(delivery_id);
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        // simple wallet flow similar to rides (reuse wallet utils if present)
        const wallet = yield (yield Promise.resolve().then(() => __importStar(require("../models/wallet")))).default.findOne({ owner_id: user_id });
        if (!wallet)
            return res.status(400).json({ msg: "No wallet" });
        const debit_wallet = (yield Promise.resolve().then(() => __importStar(require("../utils/wallet")))).debit_wallet;
        const transaction = yield debit_wallet({
            wallet_id: new mongoose_1.Types.ObjectId(wallet._id),
            amount: delivery.fare,
            type: "delivery_payment",
            channel: "wallet",
            ride_id: new mongoose_1.Types.ObjectId(delivery._id),
            reference: (yield Promise.resolve().then(() => __importStar(require("../utils/gen_unique_ref")))).generate_unique_reference(),
            metadata: { for: "delivery_payment" },
        });
        delivery.payment_status = "paid";
        delivery.payment_method = "wallet";
        yield delivery.save();
        // Notify the assigned driver that payment succeeded
        if (delivery.driver) {
            const driver_socket = yield (0, get_id_1.get_driver_socket_id)(delivery.driver.toString());
            if (driver_socket) {
                server_1.io.to(driver_socket).emit("delivery_paid", { delivery_id });
            }
        }
        res.status(200).json({ msg: "Payment successful", transaction });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ msg: "Failed to pay for delivery", err: err.message });
    }
});
exports.pay_for_delivery = pay_for_delivery;
const get_driver_active_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const delivery = yield delivery_1.default.findOne({
            driver: driver_id,
            status: { $in: ["accepted", "arrived", "picked_up", "in_transit"] },
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
            .populate("sender", "name phone profile_pic");
        res.status(200).json({ msg: "success", delivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_active_delivery = get_driver_active_delivery;
// --- Admin functions for deliveries ---
const admin_get_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        // Get all deliveries with populated data for search
        let deliveries = yield (yield Promise.resolve().then(() => __importStar(require("../models/delivery")))).default
            .find(filter)
            .sort({ createdAt: -1 })
            .populate("sender", "name phone")
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle",
            populate: { path: "user", select: "name phone" },
        });
        // Apply search filter if provided
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            deliveries = deliveries.filter((delivery) => {
                var _a, _b, _c, _d, _e, _f;
                const id = delivery._id.toString().toLowerCase();
                const senderName = (((_a = delivery.sender) === null || _a === void 0 ? void 0 : _a.name) || "").toLowerCase();
                const driverName = (((_c = (_b = delivery.driver) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || "").toLowerCase();
                const pickupAddress = (((_d = delivery.pickup) === null || _d === void 0 ? void 0 : _d.address) || "").toLowerCase();
                const dropoffAddress = (((_e = delivery.dropoff) === null || _e === void 0 ? void 0 : _e.address) || "").toLowerCase();
                const vehicle = (delivery.vehicle || "").toLowerCase();
                const packageType = (((_f = delivery.package) === null || _f === void 0 ? void 0 : _f.type) || "").toLowerCase();
                const deliveryStatus = (delivery.status || "").toLowerCase();
                return (id.includes(searchLower) ||
                    senderName.includes(searchLower) ||
                    driverName.includes(searchLower) ||
                    pickupAddress.includes(searchLower) ||
                    dropoffAddress.includes(searchLower) ||
                    vehicle.includes(searchLower) ||
                    packageType.includes(searchLower) ||
                    deliveryStatus.includes(searchLower));
            });
        }
        // Get total count and apply pagination
        const total = deliveries.length;
        const paginatedDeliveries = deliveries.slice(skip, skip + limit);
        const pages = Math.ceil(total / limit);
        return res.status(200).json({
            msg: "success",
            deliveries: paginatedDeliveries,
            total,
            page,
            pages,
        });
    }
    catch (err) {
        console.error("admin_get_deliveries error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_deliveries = admin_get_deliveries;
const admin_get_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id ||
            req.query.delivery_id ||
            req.query.deliveryId ||
            ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) ||
            "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const delivery = yield (yield Promise.resolve().then(() => __importStar(require("../models/delivery")))).default
            .findById(id)
            .populate("sender", "name phone profile_pic")
            .populate({
            path: "driver",
            populate: { path: "user", select: "name phone profile_pic" },
        });
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        let transactionsCount = 0;
        let activitiesCount = 0;
        try {
            const transactionModel = (yield Promise.resolve().then(() => __importStar(require("../models/transaction")))).default;
            transactionsCount = yield transactionModel.countDocuments({
                ride_id: delivery._id,
            });
        }
        catch (e) {
            // ignore
        }
        try {
            activitiesCount = yield activity_1.default.countDocuments({
                "metadata.delivery_id": delivery._id,
            });
        }
        catch (e) {
            // ignore
        }
        return res
            .status(200)
            .json({ msg: "success", delivery, transactionsCount, activitiesCount });
    }
    catch (err) {
        console.error("admin_get_delivery error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_delivery = admin_get_delivery;
const admin_cancel_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const deliveryModel = (yield Promise.resolve().then(() => __importStar(require("../models/delivery")))).default;
        const delivery = yield deliveryModel.findById(id);
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        // Only allow admin to cancel deliveries in transit (mirror ride ongoing)
        if (delivery.status !== "in_transit") {
            return res
                .status(400)
                .json({ msg: "Only in_transit deliveries can be cancelled by admin" });
        }
        const senderSocket = yield (0, get_id_1.get_user_socket_id)(delivery.sender.toString());
        const driverSocket = delivery.driver
            ? yield (0, get_id_1.get_driver_socket_id)(delivery.driver.toString())
            : null;
        if (senderSocket)
            server_1.io.to(senderSocket).emit("delivery_cancel", {
                reason,
                by: "admin",
                delivery_id: id,
            });
        if (driverSocket)
            server_1.io.to(driverSocket).emit("delivery_cancel", {
                reason,
                by: "admin",
                delivery_id: id,
            });
        delivery.status = "cancelled";
        delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { cancelled_at: new Date() });
        delivery.cancelled = { by: "admin", reason };
        yield delivery.save();
        const driver_user_id = yield (0, get_id_1.get_driver_user_id)(String(delivery.sender));
        try {
            const senderTokens = (delivery === null || delivery === void 0 ? void 0 : delivery.sender)
                ? yield (0, get_id_1.get_user_push_tokens)(delivery.sender.toString())
                : [];
            const driverTokens = (delivery === null || delivery === void 0 ? void 0 : delivery.driver)
                ? yield (0, get_id_1.get_driver_push_tokens)(delivery.driver.toString())
                : [];
            if (senderTokens.length) {
                yield (0, expo_push_1.sendNotification)([String(delivery.sender)], "Delivery cancelled", "This delivery was cancelled by Igle", {
                    type: "delivery_cancelled",
                    deliveryId: delivery._id,
                    by: "admin",
                });
            }
            if (driverTokens.length) {
                yield (0, expo_push_1.sendNotification)([String(driver_user_id)], "Delivery cancelled", "This delivery was cancelled by Igle", {
                    type: "delivery_cancelled",
                    deliveryId: delivery._id,
                    by: "admin",
                    role: "driver",
                });
            }
        }
        catch (e) {
            console.error("Failed to send cancel push notifications for admin cancel:", e);
        }
        return res
            .status(200)
            .json({ msg: "Delivery cancelled by admin", delivery });
    }
    catch (err) {
        console.error("admin_cancel_delivery error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_cancel_delivery = admin_cancel_delivery;
const admin_delete_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const deliveryModel = (yield Promise.resolve().then(() => __importStar(require("../models/delivery")))).default;
        const delivery = yield deliveryModel.findById(id);
        if (!delivery)
            return res.status(404).json({ msg: "Delivery not found" });
        // delete related transactions (best-effort)
        try {
            yield (yield Promise.resolve().then(() => __importStar(require("../models/transaction")))).default.deleteMany({ ride_id: delivery._id });
        }
        catch (e) {
            // ignore
        }
        // delete activities related to this delivery
        try {
            yield activity_1.default.deleteMany({
                "metadata.delivery_id": delivery._id,
            });
        }
        catch (e) {
            // ignore
        }
        yield deliveryModel.deleteOne({ _id: delivery._id });
        return res.status(200).json({ msg: "Delivery and related data deleted" });
    }
    catch (err) {
        console.error("admin_delete_delivery error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_delete_delivery = admin_delete_delivery;
