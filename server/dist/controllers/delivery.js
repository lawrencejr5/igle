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
exports.pay_for_delivery = exports.update_delivery_status = exports.cancel_delivery = exports.accept_delivery = exports.get_user_active_deliveries = exports.get_user_deliveries = exports.get_delivery_data = exports.get_available_deliveries = exports.rebook_delivery = exports.retry_delivery = exports.request_delivery = void 0;
const delivery_1 = __importDefault(require("../models/delivery"));
const calc_commision_1 = require("../utils/calc_commision");
const server_1 = require("../server");
const get_id_1 = require("../utils/get_id");
const mongoose_1 = require("mongoose");
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
        const { pickup, dropoff, vehicle, fare, package_data, from, to } = req.body;
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
            from: from || undefined,
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
        // notify drivers (simple emit, you may filter by vehicle type client-side)
        server_1.io.emit("delivery_request", {
            delivery_id: new_delivery._id,
            msg: "New delivery request",
        });
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
        server_1.io.emit("delivery_request", {
            delivery_id: delivery._id,
            msg: "Retrying delivery request",
        });
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
            from: delivery.from || undefined,
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
        server_1.io.emit("delivery_request", {
            delivery_id: new_delivery._id,
            msg: "Delivery rebooked",
        });
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
        const deliveries = yield delivery_1.default.find(queryObj).sort({ createdAt: -1 });
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_deliveries = get_user_deliveries;
const get_user_active_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const deliveries = yield delivery_1.default.find({
            sender: user_id,
            status: {
                $in: ["pending", "accepted", "picked_up", "in_transit", "expired"],
            },
        }).sort({ createdAt: -1 });
        res
            .status(200)
            .json({ msg: "success", rowCount: deliveries.length, deliveries });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_active_deliveries = get_user_active_deliveries;
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
        switch (status) {
            case "picked_up":
                delivery.status = "picked_up";
                delivery.timestamps = Object.assign(Object.assign({}, delivery.timestamps), { picked_up_at: new Date() });
                if (sender_socket)
                    server_1.io.to(sender_socket).emit("delivery_picked_up", { delivery_id });
                break;
            case "in_transit":
                delivery.status = "in_transit";
                if (sender_socket)
                    server_1.io.to(sender_socket).emit("delivery_in_transit", { delivery_id });
                break;
            case "delivered":
                delivery.status = "delivered";
                if (sender_socket)
                    server_1.io.to(sender_socket).emit("delivery_completed", { delivery_id });
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
            type: "payment",
            channel: "wallet",
            ride_id: new mongoose_1.Types.ObjectId(delivery._id),
            reference: (yield Promise.resolve().then(() => __importStar(require("../utils/gen_unique_ref")))).generate_unique_reference(),
            metadata: { for: "delivery_payment" },
        });
        delivery.payment_status = "paid";
        delivery.payment_method = "wallet";
        yield delivery.save();
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
exports.default = {};
