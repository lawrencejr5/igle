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
exports.cancelVendorOrderPendingEarnings = exports.settleVendorOrderEarnings = exports.getOrCreateVendorWallet = void 0;
const mongoose_1 = require("mongoose");
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const restaurant_1 = __importDefault(require("../models/restaurant"));
const gen_unique_ref_1 = require("./gen_unique_ref");
/**
 * Helper to get or create a specialized Vendor Wallet for a restaurant.
 * Specialized Vendor Wallet uses owner_id: restaurant._id and owner_type: "Restaurant".
 */
const getOrCreateVendorWallet = (restaurantId) => __awaiter(void 0, void 0, void 0, function* () {
    const rId = new mongoose_1.Types.ObjectId(restaurantId);
    let wallet = yield wallet_1.default.findOne({
        owner_id: rId,
        owner_type: "Restaurant",
    });
    if (!wallet) {
        wallet = yield wallet_1.default.create({
            owner_id: rId,
            owner_type: "Restaurant",
            balance: 0,
            pending_balance: 0,
        });
    }
    return wallet;
});
exports.getOrCreateVendorWallet = getOrCreateVendorWallet;
/**
 * Settles a delivered food order: moves earnings from pending_balance to withdrawable balance,
 * and updates transaction status to "success". If no transaction exists, creates a new one.
 */
const settleVendorOrderEarnings = (order) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!order || !order.restaurant)
            return false;
        const earningsAmount = ((_a = order.pricing) === null || _a === void 0 ? void 0 : _a.restaurant_earnings) || ((_b = order.pricing) === null || _b === void 0 ? void 0 : _b.subtotal) || 0;
        if (earningsAmount <= 0)
            return true;
        const wallet = yield (0, exports.getOrCreateVendorWallet)(order.restaurant);
        // Deduct from pending, add to withdrawable balance
        wallet.pending_balance = Math.max(0, (wallet.pending_balance || 0) - earningsAmount);
        wallet.balance = (wallet.balance || 0) + earningsAmount;
        yield wallet.save();
        // Try finding existing pending transaction for this food order & vendor wallet
        let txn = yield transaction_1.default.findOneAndUpdate({
            food_order_id: new mongoose_1.Types.ObjectId(order._id),
            wallet_id: wallet._id,
        }, {
            $set: {
                status: "success",
                type: "vendor_earnings",
                "metadata.status": "delivered",
                "metadata.description": `Earnings for delivered order #${order.order_number}`,
            },
        }, { new: true });
        if (!txn) {
            txn = yield transaction_1.default.findOneAndUpdate({
                food_order_id: order._id,
                wallet_id: wallet._id,
            }, {
                $set: {
                    status: "success",
                    type: "vendor_earnings",
                    "metadata.status": "delivered",
                    "metadata.description": `Earnings for delivered order #${order.order_number}`,
                },
            }, { new: true });
        }
        // If no existing transaction was found, create a new success transaction record for vendor wallet
        if (!txn) {
            const restaurant = yield restaurant_1.default.findById(order.restaurant);
            yield transaction_1.default.create({
                wallet_id: wallet._id,
                type: "vendor_earnings",
                amount: earningsAmount,
                status: "success",
                channel: "wallet",
                reference: (0, gen_unique_ref_1.generate_unique_reference)(),
                food_order_id: order._id,
                metadata: {
                    order_id: order._id,
                    order_number: order.order_number,
                    restaurant_id: order.restaurant,
                    restaurant_name: (restaurant === null || restaurant === void 0 ? void 0 : restaurant.name) || "Restaurant",
                    type: "food_order_earnings",
                    status: "delivered",
                    description: `Earnings for delivered order #${order.order_number}`,
                },
            });
        }
        return true;
    }
    catch (err) {
        console.error("settleVendorOrderEarnings error:", err);
        return false;
    }
});
exports.settleVendorOrderEarnings = settleVendorOrderEarnings;
/**
 * Cancels pending earnings for an order if rejected/cancelled before delivery:
 * removes funds from pending_balance and marks transaction status to "failed".
 */
const cancelVendorOrderPendingEarnings = (order) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        if (!order || !order.restaurant)
            return false;
        const earningsAmount = ((_a = order.pricing) === null || _a === void 0 ? void 0 : _a.restaurant_earnings) || ((_b = order.pricing) === null || _b === void 0 ? void 0 : _b.subtotal) || 0;
        if (earningsAmount <= 0)
            return true;
        const wallet = yield (0, exports.getOrCreateVendorWallet)(order.restaurant);
        // Deduct from pending
        wallet.pending_balance = Math.max(0, (wallet.pending_balance || 0) - earningsAmount);
        yield wallet.save();
        // Mark transaction as failed/cancelled
        yield transaction_1.default.updateMany({
            food_order_id: order._id,
            wallet_id: wallet._id,
        }, {
            $set: {
                status: "failed",
                "metadata.status": "cancelled",
            },
        });
        return true;
    }
    catch (err) {
        console.error("cancelVendorOrderPendingEarnings error:", err);
        return false;
    }
});
exports.cancelVendorOrderPendingEarnings = cancelVendorOrderPendingEarnings;
