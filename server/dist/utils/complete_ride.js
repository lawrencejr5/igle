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
exports.complete_ride = void 0;
const mongoose_1 = require("mongoose");
const wallet_1 = __importDefault(require("../models/wallet"));
const app_wallet_1 = __importDefault(require("../models/app_wallet"));
const commission_1 = __importDefault(require("../models/commission"));
const transaction_1 = __importDefault(require("../models/transaction"));
const wallet_2 = require("../utils/wallet");
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const task_progress_1 = require("./task_progress");
const complete_ride = (ride) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wallet = yield wallet_1.default.findOne({ owner_id: ride.driver });
        if (!wallet) {
            return { success: false, statusCode: 404, message: "Wallet not found" };
        }
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
        yield (0, wallet_2.credit_wallet)(reference);
        const fund_app_wallet = yield app_wallet_1.default.findOneAndUpdate({}, { $inc: { balance: Number(ride.commission) } }, { new: true });
        if (!fund_app_wallet)
            throw new Error("Funding app wallet failed");
        const commision_record = yield commission_1.default.create({
            ride_id: new mongoose_1.Types.ObjectId(ride._id),
            amount: Number(ride.commission),
            credited: true,
        });
        if (!commision_record)
            throw new Error("Recording commission failed");
        ride.timestamps.completed_at = new Date();
        ride.status = "completed";
        ride.driver_paid = true;
        yield ride.save();
        // Update rider task progress for all active 'ride' tasks
        try {
            if (ride.rider) {
                yield (0, task_progress_1.incrementUserTasksProgress)(ride.rider, "ride");
            }
        }
        catch (progressErr) {
            console.error("Failed to increment rider task progress:", progressErr);
        }
        return { success: true };
    }
    catch (err) {
        return {
            success: false,
            statusCode: 500,
            message: err.message,
        };
    }
});
exports.complete_ride = complete_ride;
