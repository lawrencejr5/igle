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
exports.create_wallet = exports.get_wallet_balance = exports.request_withdrawal = exports.verify_payment = exports.paystack_redirect = exports.fund_wallet = void 0;
const wallet_1 = __importDefault(require("../models/wallet"));
const user_1 = __importDefault(require("../models/user"));
const transaction_1 = __importDefault(require("../models/transaction"));
const driver_1 = __importDefault(require("../models/driver"));
const wallet_2 = require("../utils/wallet");
const get_id_1 = require("../utils/get_id");
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const axios_1 = __importDefault(require("axios"));
const paystack_1 = require("../utils/paystack");
const fund_wallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { amount, channel, callback_url } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ msg: "Invalid amount" });
        }
        const owner_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield user_1.default.findById(owner_id);
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const wallet = yield wallet_1.default.findOne({ owner_id });
        if (!wallet)
            return res.status(404).json({ msg: "Wallet not found" });
        const reference = (0, gen_unique_ref_1.generate_unique_reference)();
        const init = yield (0, paystack_1.initialize_paystack_transaction)({
            email: user.email,
            amount,
            reference,
            callback_url: `http://192.168.230.123:5000/api/v1/wallet/redirect?reference=${reference}&callback_url=${callback_url}`,
        });
        yield transaction_1.default.create({
            wallet_id: wallet._id,
            type: "funding",
            amount,
            status: "pending",
            channel,
            reference,
            metadata: { from: "paystack" },
        });
        res.status(200).json({
            msg: "Payment link generated",
            authorization_url: init.authorization_url,
            reference: init.reference,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to initialize transaction" });
    }
});
exports.fund_wallet = fund_wallet;
const paystack_redirect = (req, res) => {
    const { reference, callback_url } = req.query;
    // Return a tiny HTML page that deep-links back into your app
    res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Redirecting...</title>
      </head>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h2>Redirecting to app...</h2>
        <script>
          // Automatically redirect into the app
          window.location.href = "${callback_url}?reference=${reference}";
        </script>
        <p>If you are not redirected, <a href="igle://paystack-redirect?reference=${reference}">click here</a>.</p>
      </body>
    </html>
  `);
};
exports.paystack_redirect = paystack_redirect;
const verify_payment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reference } = req.query;
        const result = yield (0, paystack_1.verify_paystack_transaction)(reference);
        if (result.status !== "success") {
            return res.status(400).json({ msg: "Payment not successful" });
        }
        // Credit the user’s wallet
        const tx = yield (0, wallet_2.credit_wallet)(reference);
        res.status(200).json({ msg: "Wallet funded", transaction: tx });
    }
    catch (err) {
        console.error(err);
        const msg = err.message || "Verification failed";
        res.status(500).json({ msg });
    }
});
exports.verify_payment = verify_payment;
const request_withdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const amount = Number(req.body.amount);
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        const driver = yield driver_1.default.findById(driver_id);
        const wallet = yield wallet_1.default.findOne({
            owner_id: driver_id,
            owner_type: "Driver",
        });
        if (!driver || !wallet)
            throw new Error("Driver or wallet not found");
        if (!((_b = driver.bank) === null || _b === void 0 ? void 0 : _b.recipient_code)) {
            return res.status(400).json({ msg: "Bank info not set" });
        }
        if (wallet.balance < amount) {
            return res.status(400).json({ msg: "Insufficient wallet balance" });
        }
        // Send money to bank using Paystack Transfer
        const transfer = yield axios_1.default.post("https://api.paystack.co/transfer", {
            source: "balance",
            amount: amount * 100, // in kobo
            recipient: driver.bank.recipient_code,
            reason: "Driver withdrawal",
        }, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });
        // Deduct from wallet
        wallet.balance -= amount;
        yield wallet.save();
        // Save transaction
        yield transaction_1.default.create({
            wallet_id: wallet._id,
            reference: transfer.data.data.reference,
            type: "payout",
            status: "success", // or "pending" if you want to verify later
            amount,
            channel: "bank",
            metadata: {
                for: "driver_withdrawal",
                driver_id: req.user.id,
            },
        });
        res.json({ msg: "Withdrawal successful", transfer: transfer.data.data });
    }
    catch (err) {
        console.error(((_c = err.response) === null || _c === void 0 ? void 0 : _c.data) || err.message);
        res.status(500).json({ msg: "Withdrawal failed", error: err.message });
    }
});
exports.request_withdrawal = request_withdrawal;
const get_wallet_balance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { owner_type } = req.query;
        let owner_id;
        if (owner_type === "User") {
            owner_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        }
        else if (owner_type === "Driver") {
            owner_id = yield (0, get_id_1.get_driver_id)((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        }
        else {
            res.status(400).json({ msg: "Owner type is invalid" });
            return;
        }
        const wallet = yield wallet_1.default.findOne({ owner_id });
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }
        res.status(200).json({ msg: "success", wallet });
    }
    catch (err) {
        res.status(500).json({ message: "Something went wrong", err });
    }
});
exports.get_wallet_balance = get_wallet_balance;
const create_wallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { owner_type } = req.query;
        if (!owner_type) {
            res.status(400).json({ msg: "Owner type is empty" });
            return;
        }
        let owner_id;
        if (owner_type === "User") {
            owner_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        }
        else if (owner_type === "Driver") {
            owner_id = yield (0, get_id_1.get_driver_id)((_b = req.user) === null || _b === void 0 ? void 0 : _b.id);
        }
        else {
            res.status(400).json({ msg: "Owner type is invalid" });
            return;
        }
        const wallet = yield wallet_1.default.create({ owner_id, owner_type, balance: 0 });
        res
            .status(201)
            .json({ msg: `${owner_type} wallet created successfully`, wallet });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error.", err });
    }
});
exports.create_wallet = create_wallet;
