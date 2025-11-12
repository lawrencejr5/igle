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
exports.admin_process_driver_application = exports.admin_get_driver_applications = exports.admin_block_driver = exports.admin_delete_driver = exports.admin_edit_driver = exports.admin_get_driver = exports.admin_get_drivers = exports.get_driver_cancelled_deliveries = exports.get_driver_delivered_deliveries = exports.get_driver_rides_history = exports.get_driver_cancelled_rides = exports.get_driver_completed_rides = exports.save_bank_info = exports.update_driver_info = exports.update_driver_rating = exports.get_driver_by_user = exports.set_driver_online_status = exports.update_driver_license = exports.update_vehicle_info = exports.set_driver_availability = exports.get_driver_transactions = exports.get_driver_active_delivery = exports.get_driver_active_ride = exports.get_driver = exports.update_location = exports.upload_driver_profile_pic = exports.create_driver = void 0;
const driver_1 = __importDefault(require("../models/driver"));
const wallet_1 = __importDefault(require("../models/wallet"));
const ride_1 = __importDefault(require("../models/ride"));
const delivery_1 = __importDefault(require("../models/delivery"));
const transaction_1 = __importDefault(require("../models/transaction"));
const user_1 = __importDefault(require("../models/user"));
const get_id_1 = require("../utils/get_id");
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const upload_file_1 = require("../utils/upload_file");
const promises_1 = require("fs/promises");
// helper to safely delete temp files created by multer
const safeUnlink = (path) => __awaiter(void 0, void 0, void 0, function* () {
    if (!path)
        return;
    try {
        yield (0, promises_1.unlink)(path);
    }
    catch (err) {
        console.error("Failed to delete temp file:", path, err);
    }
});
// Create a new driver
const create_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { vehicle_type } = req.body;
        const user = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const existing_driver = yield driver_1.default.findOne({ user });
        const driverData = {
            user,
            vehicle_type,
            current_location: {
                type: "Point",
                coordinates: [0, 0],
            },
        };
        let driver;
        if (existing_driver) {
            // Update the existing driver with provided data
            driver = yield driver_1.default.findByIdAndUpdate(existing_driver._id, driverData, {
                new: true,
            });
            // Ensure wallet exists (in case it was missing)
            const wallet = yield wallet_1.default.findOne({
                owner_id: driver === null || driver === void 0 ? void 0 : driver._id,
                owner_type: "Driver",
            });
            if (!wallet) {
                yield wallet_1.default.create({
                    owner_id: driver === null || driver === void 0 ? void 0 : driver._id,
                    owner_type: "Driver",
                    balance: 0,
                });
            }
            res.status(200).json({ msg: "Driver updated successfully", driver });
            return;
        }
        // Create new driver
        driver = yield driver_1.default.create(driverData);
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
// Upload or update driver's profile image
const upload_driver_profile_pic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const file = req.file;
        if (!file || !file.path) {
            res.status(400).json({ msg: "No file provided" });
            return;
        }
        const filePath = file.path;
        let uploaded = null;
        try {
            uploaded = yield (0, upload_file_1.uploadToCloudinary)(filePath, "igle_images/driver_profile");
        }
        finally {
            // remove multer temp file
            yield safeUnlink(filePath);
        }
        if (!uploaded || !uploaded.url) {
            res.status(500).json({ msg: "Failed to upload image" });
            return;
        }
        const driver = yield driver_1.default.findById(driver_id);
        if (!driver) {
            res.status(404).json({ msg: "Driver not found" });
            return;
        }
        // Save new profile image URL
        driver.profile_img = uploaded.url;
        yield driver.save();
        res
            .status(200)
            .json({ msg: "Profile image uploaded", profile_img: driver.profile_img });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.upload_driver_profile_pic = upload_driver_profile_pic;
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
        // include driver wallet balance if exists
        const wallet = yield wallet_1.default.findOne({
            owner_id: driver._id,
            owner_type: "Driver",
        });
        res.status(200).json({
            msg: "success",
            driver,
            wallet_balance: wallet ? wallet.balance : 0,
        });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver = get_driver;
// Get driver's active ride
const get_driver_active_ride = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        // Find the ride where driver is assigned and status is ongoing or accepted or arrived
        const activeRide = yield ride_1.default.findOne({
            driver: driver_id,
            status: { $in: ["ongoing", "accepted", "arrived"] },
        })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone",
            },
        })
            .populate("rider", "name phone");
        if (!activeRide) {
            res.status(404).json({ msg: "No active ride found for this driver." });
            return;
        }
        res.status(200).json({ msg: "success", ride: activeRide });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_active_ride = get_driver_active_ride;
// Get driver's active delivery
const get_driver_active_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        // Find the delivery where driver is assigned and status is active (accepted/arrived/in_transit)
        const activeDelivery = yield delivery_1.default.findOne({
            driver: driver_id,
            status: { $in: ["accepted", "arrived", "picked_up", "in_transit"] },
        })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone",
            },
        })
            .populate("sender", "name phone profile_pic");
        if (!activeDelivery) {
            res
                .status(404)
                .json({ msg: "No active delivery found for this driver." });
            return;
        }
        res.status(200).json({ msg: "success", delivery: activeDelivery });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_active_delivery = get_driver_active_delivery;
// Get driver transactions
const get_driver_transactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const wallet = yield wallet_1.default.findOne({
            owner_id: driver_id,
            owner_type: "Driver",
        });
        if (!wallet) {
            res.status(404).json({ msg: "Driver wallet not found." });
            return;
        }
        const { limit = 20, skip = 0, type } = req.query;
        // Build query
        const query = { wallet_id: wallet._id };
        if (type) {
            query.type = type;
        }
        const transactions = yield transaction_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate("ride_id");
        // Get total count for pagination
        const total = yield transaction_1.default.countDocuments(query);
        res.status(200).json({
            msg: "success",
            transactions,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_transactions = get_driver_transactions;
// Set driver availability
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
        const { exterior_image, interior_image, brand, model, color, year, plate_number, } = req.body;
        if (!brand || !model || !color || !year || !plate_number) {
            res.status(400).json({ msg: "All vehicle fields are required." });
            return;
        }
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const files = req.files || {};
        // Start with values from body (may be null/undefined)
        let exterior_image_url = exterior_image || null;
        let interior_image_url = interior_image || null;
        // Upload exterior if file provided
        if (files.vehicle_exterior &&
            Array.isArray(files.vehicle_exterior) &&
            files.vehicle_exterior[0] &&
            files.vehicle_exterior[0].path) {
            const filePath = files.vehicle_exterior[0].path;
            try {
                const uploaded = yield (0, upload_file_1.uploadToCloudinary)(filePath, "igle_images/vehicle");
                if (uploaded && uploaded.url)
                    exterior_image_url = uploaded.url;
            }
            finally {
                yield safeUnlink(filePath);
            }
        }
        // Upload interior if file provided
        if (files.vehicle_interior &&
            Array.isArray(files.vehicle_interior) &&
            files.vehicle_interior[0] &&
            files.vehicle_interior[0].path) {
            const filePath = files.vehicle_interior[0].path;
            try {
                const uploaded = yield (0, upload_file_1.uploadToCloudinary)(filePath, "igle_images/vehicle");
                if (uploaded && uploaded.url)
                    interior_image_url = uploaded.url;
            }
            finally {
                yield safeUnlink(filePath);
            }
        }
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, {
            vehicle: {
                exterior_image: exterior_image_url,
                interior_image: interior_image_url,
                brand,
                model,
                color,
                year,
                plate_number,
            },
        }, { new: true });
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
        // extract individual driver licence fields from body
        const { number, expiry_date, front_image, back_image, selfie_with_licence, } = req.body;
        if (!number || !expiry_date) {
            res
                .status(400)
                .json({ msg: "Driver licence number and expiry date are required." });
            return;
        }
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const files = req.files || {};
        // start with provided values (may be null)
        let front_image_url = front_image || null;
        let back_image_url = back_image || null;
        let selfie_image_url = selfie_with_licence || null;
        // upload front image if provided
        if (files.license_front &&
            files.license_front[0] &&
            files.license_front[0].path) {
            const filePath = files.license_front[0].path;
            try {
                const uploaded = yield (0, upload_file_1.uploadToCloudinary)(filePath, "igle_images/driver_license");
                if (uploaded && uploaded.url)
                    front_image_url = uploaded.url;
            }
            finally {
                yield safeUnlink(filePath);
            }
        }
        // upload back image if provided
        if (files.license_back &&
            files.license_back[0] &&
            files.license_back[0].path) {
            const filePath = files.license_back[0].path;
            try {
                const uploaded = yield (0, upload_file_1.uploadToCloudinary)(filePath, "igle_images/driver_license");
                if (uploaded && uploaded.url)
                    back_image_url = uploaded.url;
            }
            finally {
                yield safeUnlink(filePath);
            }
        }
        // upload selfie with licence if provided (accept either field name variant)
        const selfieFile = files.selfie_with_license && files.selfie_with_license[0];
        if (selfieFile && selfieFile.path) {
            const filePath = selfieFile.path;
            try {
                const uploaded = yield (0, upload_file_1.uploadToCloudinary)(filePath, "igle_images/driver_license");
                if (uploaded && uploaded.url)
                    selfie_image_url = uploaded.url;
            }
            finally {
                yield safeUnlink(filePath);
            }
        }
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, {
            driver_licence: {
                number,
                expiry_date,
                front_image: front_image_url,
                back_image: back_image_url,
                selfie_with_licence: selfie_image_url,
            },
        }, { new: true });
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
        res.status(500).json({ msg: "Server error.", err });
        console.log(err);
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
        const driver = yield driver_1.default.findByIdAndUpdate(driver_id, updateData, {
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
            application: "submitted",
        });
        res.json({ msg: "Bank info saved successfully" });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Bank info is incorrect", err });
    }
});
exports.save_bank_info = save_bank_info;
// Get driver's completed rides
const get_driver_completed_rides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { limit = 20, skip = 0 } = req.query;
        const completedRides = yield ride_1.default.find({
            driver: driver_id,
            status: "completed",
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate({ path: "rider", select: "name phone" })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle rating",
            populate: { path: "user", select: "name phone" },
        });
        // Get total count for pagination
        const total = yield ride_1.default.countDocuments({
            driver: driver_id,
            status: "completed",
        });
        res.status(200).json({
            msg: "success",
            rides: completedRides,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_completed_rides = get_driver_completed_rides;
// Get driver's cancelled rides
const get_driver_cancelled_rides = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { limit = 20, skip = 0 } = req.query;
        const cancelledRides = yield ride_1.default.find({
            driver: driver_id,
            status: "cancelled",
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate({ path: "rider", select: "name phone" })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle rating",
            populate: { path: "user", select: "name phone" },
        });
        // Get total count for pagination
        const total = yield ride_1.default.countDocuments({
            driver: driver_id,
            status: "cancelled",
        });
        res.status(200).json({
            msg: "success",
            rides: cancelledRides,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_cancelled_rides = get_driver_cancelled_rides;
// Get all driver's rides (completed and cancelled)
const get_driver_rides_history = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { limit = 20, skip = 0, status } = req.query;
        // Build query
        const query = {
            driver: driver_id,
            status: status || { $in: ["completed", "cancelled"] },
        };
        const rides = yield ride_1.default.find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate({ path: "rider", select: "name phone" })
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle rating",
            populate: { path: "user", select: "name phone" },
        });
        // Get total count for pagination
        const total = yield ride_1.default.countDocuments(query);
        res.status(200).json({
            msg: "success",
            rides,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_rides_history = get_driver_rides_history;
// Get driver's delivered deliveries
const get_driver_delivered_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { limit = 5, skip = 0 } = req.query;
        const Delivery = (yield Promise.resolve().then(() => __importStar(require("../models/delivery")))).default;
        const deliveries = yield Delivery.find({
            driver: driver_id,
            status: "delivered",
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate("sender", "name phone profile_pic")
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        });
        const total = yield Delivery.countDocuments({
            driver: driver_id,
            status: "delivered",
        });
        res.status(200).json({
            msg: "success",
            deliveries,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_delivered_deliveries = get_driver_delivered_deliveries;
// Get driver's cancelled deliveries
const get_driver_cancelled_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const { limit = 5, skip = 0 } = req.query;
        const Delivery = (yield Promise.resolve().then(() => __importStar(require("../models/delivery")))).default;
        const deliveries = yield Delivery.find({
            driver: driver_id,
            status: "cancelled",
        })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip))
            .populate("sender", "name phone profile_pic")
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name email phone profile_pic",
            },
        });
        const total = yield Delivery.countDocuments({
            driver: driver_id,
            status: "cancelled",
        });
        res.status(200).json({
            msg: "success",
            deliveries,
            pagination: {
                total,
                limit: Number(limit),
                skip: Number(skip),
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_driver_cancelled_deliveries = get_driver_cancelled_deliveries;
// --- Admin functions (moved to bottom) ---
// Admin: fetch all drivers (paginated)
const admin_get_drivers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(403).json({ msg: "admin role required for this action" });
        return;
    }
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const { status, search, dateFrom, dateTo } = req.query;
        const filter = { application: "approved" };
        // Status filter
        if (status) {
            if (status === "active")
                filter.is_active = true;
            else if (status === "suspended")
                filter.is_active = false;
        }
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
        // Get all drivers with populated data for search
        let drivers = yield driver_1.default.find(filter)
            .populate("user")
            .sort({ createdAt: -1 });
        // Apply search filter if provided
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            drivers = drivers.filter((driver) => {
                var _a, _b, _c, _d;
                const id = driver._id.toString().toLowerCase();
                const userName = (((_a = driver.user) === null || _a === void 0 ? void 0 : _a.name) || "").toLowerCase();
                const userEmail = (((_b = driver.user) === null || _b === void 0 ? void 0 : _b.email) || "").toLowerCase();
                const userPhone = (((_c = driver.user) === null || _c === void 0 ? void 0 : _c.phone) || "").toLowerCase();
                const vehicleType = (driver.vehicle_type || "").toLowerCase();
                const plateNumber = (((_d = driver.vehicle) === null || _d === void 0 ? void 0 : _d.plate_number) || "").toLowerCase();
                return (id.includes(searchLower) ||
                    userName.includes(searchLower) ||
                    userEmail.includes(searchLower) ||
                    userPhone.includes(searchLower) ||
                    vehicleType.includes(searchLower) ||
                    plateNumber.includes(searchLower));
            });
        }
        // Get total count and apply pagination
        const total = drivers.length;
        const paginatedDrivers = drivers.slice(skip, skip + limit);
        const pages = Math.ceil(total / limit);
        return res
            .status(200)
            .json({ msg: "success", drivers: paginatedDrivers, total, page, pages });
    }
    catch (err) {
        console.error("admin_get_drivers error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_drivers = admin_get_drivers;
// Admin: fetch driver by id (query ?id=...)
const admin_get_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(403).json({ msg: "admin role required for this action" });
        return;
    }
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const driver = yield driver_1.default.findById(id).populate("user");
        if (!driver)
            return res.status(404).json({ msg: "Driver not found" });
        const wallet = yield wallet_1.default.findOne({
            owner_id: driver._id,
            owner_type: "Driver",
        });
        res.status(200).json({
            msg: "success",
            driver,
            wallet_balance: wallet ? wallet.balance : 0,
        });
    }
    catch (err) {
        console.error("admin_get_driver error:", err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_driver = admin_get_driver;
// Admin: edit driver
const admin_edit_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(403).json({ msg: "admin role required for this action" });
        return;
    }
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const allowed = [
            "profile_img",
            "vehicle_type",
            "vehicle",
            "is_available",
            "rating",
            "bank",
            "driver_licence",
            "total_trips",
            "num_of_reviews",
        ];
        const update = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined)
                update[key] = req.body[key];
        }
        if (Object.keys(update).length === 0)
            return res.status(400).json({ msg: "Nothing to update" });
        const driver = yield driver_1.default.findByIdAndUpdate(id, update, { new: true });
        if (!driver)
            return res.status(404).json({ msg: "Driver not found" });
        res.status(200).json({ msg: "Driver updated", driver });
    }
    catch (err) {
        console.error("admin_edit_driver error:", err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_edit_driver = admin_edit_driver;
// Admin: delete driver and related data
const admin_delete_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(403).json({ msg: "admin role required for this action" });
        return;
    }
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const driver = yield driver_1.default.findById(id);
        if (!driver)
            return res.status(404).json({ msg: "Driver not found" });
        const soft = req.query.soft === "true" || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.soft) === true;
        if (soft) {
            // attempt soft-delete if schema allows
            try {
                driver.is_deleted = true;
                driver.deleted_at = new Date();
                driver.deleted_by = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
                yield driver.save();
                return res.status(200).json({ msg: "Driver soft-deleted" });
            }
            catch (e) {
                console.warn("soft-delete not supported on Driver schema, falling back to hard delete", e);
            }
        }
        // delete driver's wallets and transactions
        const wallets = yield wallet_1.default.find({ owner_id: driver._id });
        const walletIds = wallets.map((w) => w._id);
        if (walletIds.length) {
            yield transaction_1.default.deleteMany({ wallet_id: { $in: walletIds } });
            yield wallet_1.default.deleteMany({ _id: { $in: walletIds } });
        }
        // delete rides and deliveries where driver is assigned
        yield ride_1.default.deleteMany({ driver: driver._id });
        yield delivery_1.default.deleteMany({ driver: driver._id });
        // delete driver record
        yield driver_1.default.deleteOne({ _id: driver._id });
        // optionally, do not delete the user account here — admins may prefer that
        res.status(200).json({ msg: "Driver and related data deleted" });
    }
    catch (err) {
        console.error("admin_delete_driver error:", err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_delete_driver = admin_delete_driver;
// Admin: block or unblock driver (also blocks associated user)
const admin_block_driver = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        res.status(403).json({ msg: "admin role required for this action" });
        return;
    }
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const block = ((_c = req.body) === null || _c === void 0 ? void 0 : _c.block) === true || ((_d = req.query) === null || _d === void 0 ? void 0 : _d.block) === "true";
        const driver = yield driver_1.default.findById(id);
        if (!driver)
            return res.status(404).json({ msg: "Driver not found" });
        // set block flags on driver (if schema allows)
        try {
            driver.is_blocked = block;
            driver.blocked_at = block ? new Date() : null;
            driver.blocked_by = block ? (_e = req.user) === null || _e === void 0 ? void 0 : _e.id : null;
            yield driver.save();
        }
        catch (e) {
            console.warn("could not set block fields on Driver schema:", e);
        }
        // also block/unblock the associated user to prevent login
        if (driver.user) {
            const user = yield user_1.default.findById(driver.user);
            if (user) {
                user.is_blocked = block;
                user.blocked_at = block ? new Date() : undefined;
                user.blocked_by = block ? (_f = req.user) === null || _f === void 0 ? void 0 : _f.id : undefined;
                yield user.save();
            }
        }
        return res
            .status(200)
            .json({ msg: block ? "Driver blocked" : "Driver unblocked" });
    }
    catch (err) {
        console.error("admin_block_driver error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_block_driver = admin_block_driver;
// Admin: list driver applications (submitted)
const admin_get_driver_applications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        // const includeDeleted = req.query.include_deleted === "true";
        const filter = { application: "submitted" };
        // if (!includeDeleted) filter.is_deleted = false;
        const [total, drivers] = yield Promise.all([
            driver_1.default.countDocuments(filter),
            driver_1.default.find(filter)
                .populate("user")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 }),
        ]);
        const pages = Math.ceil(total / limit);
        return res
            .status(200)
            .json({ msg: "success", drivers, total, page, pages });
    }
    catch (err) {
        console.error("admin_get_driver_applications error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_driver_applications = admin_get_driver_applications;
// Admin: approve or reject a driver's application
const admin_process_driver_application = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const action = (req.query.action || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.action) || "")
            .toString()
            .toLowerCase();
        if (!["approve", "reject"].includes(action))
            return res
                .status(400)
                .json({ msg: "action must be 'approve' or 'reject'" });
        const driver = yield driver_1.default.findById(id).populate("user");
        if (!driver)
            return res.status(404).json({ msg: "Driver not found" });
        if (action === "approve") {
            driver.application = "approved";
            yield driver.save();
            // mark user as driver and ensure wallet exists
            if (driver.user) {
                const user = yield user_1.default.findById(driver.user);
                if (user) {
                    user.is_driver = true;
                    yield user.save();
                }
            }
            // ensure wallet exists
            const wallet = yield wallet_1.default.findOne({
                owner_id: driver._id,
                owner_type: "Driver",
            });
            if (!wallet) {
                yield wallet_1.default.create({
                    owner_id: driver._id,
                    owner_type: "Driver",
                    balance: 0,
                });
            }
            return res
                .status(200)
                .json({ msg: "Driver application approved", driver });
        }
        // reject
        driver.application = "rejected";
        yield driver.save();
        return res.status(200).json({ msg: "Driver application rejected", driver });
    }
    catch (err) {
        console.error("admin_process_driver_application error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_process_driver_application = admin_process_driver_application;
