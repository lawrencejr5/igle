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
exports.update_driver_info = exports.update_driver_rating = exports.get_driver_by_user = exports.set_driver_online_status = exports.update_driver_license = exports.update_vehicle_info = exports.set_driver_availability = exports.get_driver = exports.update_location = exports.save_bank_info = exports.create_driver = void 0;
const driver_1 = __importDefault(require("../models/driver"));
const wallet_1 = __importDefault(require("../models/wallet"));
const get_id_1 = require("../utils/get_id");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Create a new driver
const create_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { vehicle_type, profile_img } = req.body;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const existing_driver = yield driver_1.default.findOne({ user });
        if (existing_driver) {
            res.status(409).json({ msg: "Driver already exists for this user." });
            return;
        }
        const driver = yield driver_1.default.create({
            user,
            vehicle_type,
            profile_img,
            current_location: {
                type: "Point",
                coordinates: [0, 0], // Default coordinates, will be updated later
            },
        });
        yield wallet_1.default.create({
            owner_id: driver === null || driver === void 0 ? void 0 : driver._id,
            owner_type: "Driver",
            balance: 0,
        });
        res.status(201).json({ msg: "Driver created successfully", driver });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.create_driver = create_driver;
const save_bank_info = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { account_name, account_number, bank_code, bank_name } = req.body;
        // Call Paystack to create transfer recipient
        const { data } = yield axios_1.default.post("https://api.paystack.co/transferrecipient", {
            type: "nuban",
            name: account_name,
            account_number,
            bank_code,
            currency: "NGN",
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });
        const recipient_code = data.data.recipient_code;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        // Save to driver schema
        yield driver_1.default.findByIdAndUpdate(driver_id, {
            bank: {
                account_name,
                account_number,
                bank_code,
                bank_name,
                recipient_code,
            },
        });
        res.json({ msg: "Bank info saved successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Failed to save bank info", err });
    }
});
exports.save_bank_info = save_bank_info;
// Update driver's current location
const update_location = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { coordinates } = req.body; // [longitude, latitude]
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, { "current_location.coordinates": coordinates }, { new: true });
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({
            msg: "Driver location updated successfully",
            driver_id,
            new_coordinates: (_b = driver === null || driver === void 0 ? void 0 : driver.current_location) === null || _b === void 0 ? void 0 : _b.coordinates,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_location = update_location;
// Get driver info
const get_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = req.query.driver_id || (yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id));
        const driver = yield driver_1.default.findById(id).populate("user");
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({ msg: "success", driver });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver = get_driver;
const set_driver_availability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { status } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findById(driver_id);
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        driver.is_available = status;
        yield driver.save();
        res.status(200).json({
            msg: "Driver availability set successfully",
            is_available: driver.is_available,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.set_driver_availability = set_driver_availability;
// Update vehicle information
const update_vehicle_info = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { vehicle } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, { vehicle }, { new: true });
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({
            msg: "Vehicle information updated successfully",
            vehicle: driver.vehicle,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_vehicle_info = update_vehicle_info;
// Update driver license information
const update_driver_license = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { driver_licence } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, { driver_licence }, { new: true });
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({
            msg: "Driver license information updated successfully",
            driver_licence: driver.driver_licence,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_driver_license = update_driver_license;
// Set driver online status
const set_driver_online_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { is_online } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, { is_online }, { new: true });
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({
            msg: "Driver online status updated successfully",
            is_online: driver.is_online,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.set_driver_online_status = set_driver_online_status;
// Get driver by user ID
const get_driver_by_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const driver = yield driver_1.default.findOne({ user: user_id }).populate("user");
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({ msg: "success", driver });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_by_user = get_driver_by_user;
// Update driver rating
const update_driver_rating = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { rating } = req.body;
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, { rating }, { new: true });
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({
            msg: "Driver rating updated successfully",
            rating: driver.rating,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_driver_rating = update_driver_rating;
// Update driver info - flexible function to update any driver field
const update_driver_info = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const updateData = req.body;
        // Remove any undefined or null values
        const cleanUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, value]) => value !== undefined && value !== null));
        if (Object.keys(cleanUpdateData).length === 0) {
            res.status(400).json({ msg: "No valid data provided for update." });
            return;
        }
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, cleanUpdateData, {
            new: true,
        });
        if (!driver) {
            res.status(404).json({ msg: "Driver not found." });
            return;
        }
        res.status(200).json({
            msg: "Driver information updated successfully",
            driver,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_driver_info = update_driver_info;
