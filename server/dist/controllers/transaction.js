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
exports.get_driver_earnings_stats = exports.initiate_driver_withdrawal = exports.get_driver_transactions = exports.get_user_transactions = void 0;
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const get_id_1 = require("../utils/get_id");
const driver_1 = __importDefault(require("../models/driver"));
const axios_1 = __importDefault(require("axios"));
// Helper function to get start of day/week in UTC
const getDateRanges = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Get start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return { startOfToday, startOfWeek };
};
const get_user_transactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const owner_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const wallet = yield wallet_1.default.findOne({ owner_id });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }
        const { limit = 20, skip = 0, type, status } = req.query;
        // Build query
        const query = { wallet_id: wallet._id };
        if (type) {
            query.type = type;
        }
        if (status) {
            query.status = status;
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
                hasMore: total > Number(skip) + Number(limit),
            },
        });
    }
    catch (error) {
        res.status(500).json({ message: "Could not fetch transactions", error });
    }
});
exports.get_user_transactions = get_user_transactions;
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
        const { limit = 20, skip = 0, type, status } = req.query;
        // Build query
        const query = { wallet_id: wallet._id };
        if (type) {
            query.type = type;
        }
        if (status) {
            query.status = status;
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
                hasMore: total > Number(skip) + Number(limit),
            },
        });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ msg: "Could not fetch driver transactions", error: err });
    }
});
exports.get_driver_transactions = get_driver_transactions;
const initiate_driver_withdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ msg: "Invalid withdrawal amount" });
            return;
        }
        // Get driver details including bank info
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findById(driver_id);
        if (!driver) {
            res.status(404).json({ msg: "Driver not found" });
            return;
        }
        if (!((_b = driver.bank) === null || _b === void 0 ? void 0 : _b.recipient_code)) {
            res.status(400).json({
                msg: "No bank account found. Please add your bank details first.",
            });
            return;
        }
        // Get driver's wallet
        const wallet = yield wallet_1.default.findOne({
            owner_id: driver_id,
            owner_type: "Driver",
        });
        if (!wallet) {
            res.status(404).json({ msg: "Wallet not found" });
            return;
        }
        // Check if balance is sufficient
        if (wallet.balance < amount) {
            res.status(400).json({ msg: "Insufficient balance" });
            return;
        }
        // Generate a unique reference
        const reference = `IGLE_WD_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        try {
            // Initiate transfer with Paystack
            const { data } = yield axios_1.default.post("https://api.paystack.co/transfer", {
                source: "balance",
                amount: amount * 100, // Paystack expects amount in kobo
                recipient: driver.bank.recipient_code,
                reason: `IGLE Driver Withdrawal - ${driver.user}`,
                reference,
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            });
            // Create transaction record
            const transaction = yield transaction_1.default.create({
                wallet_id: wallet._id,
                type: "payout",
                amount,
                status: "pending",
                channel: "transfer",
                reference,
                metadata: {
                    driver_id,
                    transfer_code: data.data.transfer_code,
                    recipient_code: driver.bank.recipient_code,
                    bank_name: driver.bank.bank_name,
                    account_number: driver.bank.account_number,
                },
            });
            // Deduct from wallet balance
            wallet.balance -= amount;
            yield wallet.save();
            res.status(200).json({
                msg: "Withdrawal initiated successfully",
                transaction,
                transfer_details: data.data,
            });
        }
        catch (paystackError) {
            console.error("Paystack Error:", ((_c = paystackError === null || paystackError === void 0 ? void 0 : paystackError.response) === null || _c === void 0 ? void 0 : _c.data) || paystackError);
            res.status(500).json({
                msg: "Failed to initiate transfer",
                error: ((_e = (_d = paystackError === null || paystackError === void 0 ? void 0 : paystackError.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message) || "Paystack transfer failed",
            });
        }
    }
    catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ msg: "Could not process withdrawal", error: err });
    }
});
exports.initiate_driver_withdrawal = initiate_driver_withdrawal;
const get_driver_earnings_stats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
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
        const { startOfToday, startOfWeek } = getDateRanges();
        // Get total completed rides
        const totalTrips = yield transaction_1.default.countDocuments({
            wallet_id: wallet._id,
            type: "payment",
            status: "success",
        });
        // Get today's earnings
        const todayEarnings = yield transaction_1.default.aggregate([
            {
                $match: {
                    wallet_id: wallet._id,
                    type: "payment",
                    status: "success",
                    createdAt: { $gte: startOfToday },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);
        // Get this week's earnings
        const weekEarnings = yield transaction_1.default.aggregate([
            {
                $match: {
                    wallet_id: wallet._id,
                    type: "payment",
                    status: "success",
                    createdAt: { $gte: startOfWeek },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);
        res.status(200).json({
            msg: "success",
            stats: {
                totalTrips,
                todayEarnings: ((_b = todayEarnings[0]) === null || _b === void 0 ? void 0 : _b.total) || 0,
                weekEarnings: ((_c = weekEarnings[0]) === null || _c === void 0 ? void 0 : _c.total) || 0,
            },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Could not fetch earnings stats", error: err });
    }
});
exports.get_driver_earnings_stats = get_driver_earnings_stats;
