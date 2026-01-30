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
exports.complete_ride = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const wallet_1 = __importDefault(require("../models/wallet"));
const app_wallet_1 = __importDefault(require("../models/app_wallet"));
const commission_1 = __importDefault(require("../models/commission"));
const transaction_1 = __importDefault(require("../models/transaction"));
const driver_1 = __importDefault(require("../models/driver"));
const ride_1 = __importDefault(require("../models/ride"));
const wallet_2 = require("../utils/wallet");
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const task_progress_1 = require("./task_progress");
const activity_1 = __importDefault(require("../models/activity"));
const expo_push_1 = require("./expo_push");
const complete_ride = (ride) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        const result = yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const currentRide = yield ride_1.default.findById(ride._id);
            if (!currentRide)
                throw new Error("Ride not found");
            // Idempotency check
            if (ride.status === "completed")
                return { success: true };
            if (ride.status !== "ongoing")
                throw new Error("Ride is not ongoing");
            const wallet = yield wallet_1.default.findOne({ owner_id: ride.driver });
            if (!wallet)
                throw new Error("wallet not found");
            const reference = (0, gen_unique_ref_1.generate_unique_reference)();
            yield transaction_1.default.create({
                wallet_id: new mongoose_1.Types.ObjectId(wallet._id),
                amount: ride.driver_earnings,
                type: "driver_payment",
                channel: "wallet",
                status: "pending",
                ride_id: new mongoose_1.Types.ObjectId(ride._id),
                reference,
                metadata: { for: "driver_wallet_crediting", type: "ride" },
            });
            // Credit driver wallet
            yield (0, wallet_2.credit_wallet)(reference, session);
            // Update driver's status as not busy
            yield driver_1.default.findByIdAndUpdate(ride.driver, { is_busy: false });
            // Fund app wallet with commission
            const fund_app_wallet = yield app_wallet_1.default.findOneAndUpdate({}, { $inc: { balance: Number(ride.commission) } }, { new: true });
            if (!fund_app_wallet)
                throw new Error("Funding app wallet failed");
            // Create record of commission
            const commision_record = yield commission_1.default.create({
                ride_id: new mongoose_1.Types.ObjectId(ride._id),
                amount: Number(ride.commission),
                credited: true,
            });
            if (!commision_record)
                throw new Error("Recording commission failed");
            // Increment driver number of rides
            const driver = yield driver_1.default.findById(ride.driver);
            if (driver) {
                driver.total_trips += 1;
                yield driver.save();
            }
            // Update ride status and timestamp
            ride.timestamps.completed_at = new Date();
            ride.status = "completed";
            ride.driver_paid = true;
            yield ride.save();
            return { success: true };
        }));
        yield activity_1.default.create({
            type: "ride",
            user: ride.rider,
            title: "Ride completed",
            message: `Your ride to ${ride.destination.address} has been completed`,
            metadata: { ride_id: ride._id, driver_id: ride.driver },
        });
        // Send notification regardless of socket connection
        yield (0, expo_push_1.sendNotification)([String(ride.rider)], "Ride completed", `Your ride to ${ride.destination.address} has been completed`, {
            type: "ride_completed",
            ride_id: ride._id,
        });
        try {
            if (ride.rider) {
                yield (0, task_progress_1.incrementUserTasksProgress)(ride.rider, "ride");
            }
        }
        catch (err) {
            console.error("Failed to increment rider task progress:", err);
        }
        return { success: result.success };
    }
    catch (err) {
        return {
            success: false,
            statusCode: 500,
            message: err.message,
        };
    }
    finally {
        session.endSession();
    }
});
exports.complete_ride = complete_ride;
