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
exports.create_wallet = exports.get_wallet_balance = exports.request_withdrawal = exports.verify_payment = exports.paystack_redirect = exports.paystack_webhook = exports.fund_wallet = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
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
            callback_url: `https://igleapi.onrender.com/api/v1/wallet/redirect?reference=${reference}&callback_url=${callback_url}`,
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
const paystack_webhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 1. Verify Paystack Signature
        const hash = crypto_1.default
            .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
            .update(JSON.stringify(req.body))
            .digest("hex");
        if (hash !== req.headers["x-paystack-signature"]) {
            return res.status(401).json({ msg: "If I slap u!!" });
        }
        const event = req.body;
        if (event.event === "charge.success") {
            const { reference } = event.data;
            yield (0, wallet_2.credit_wallet)(reference);
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error("Webhook Error:", err);
        res.sendStatus(500);
    }
});
exports.paystack_webhook = paystack_webhook;
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
        // Credit the wallet (returns { balance, transaction })
        const transaction_result = yield (0, wallet_2.credit_wallet)(reference);
        res
            .status(200)
            .json({ msg: "Wallet funded", transaction: transaction_result });
    }
    catch (err) {
        console.error(err);
        const msg = err.message || "Verification failed";
        res.status(500).json({ msg });
    }
});
exports.verify_payment = verify_payment;
const request_withdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const session = yield mongoose_1.default.startSession();
    try {
        const amount = Number(req.body.amount);
        const driver_id = yield (0, get_id_1.get_driver_id)((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        // 1. DATABASE WORK FIRST
        const result = yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            const driver = yield driver_1.default.findById(driver_id);
            const wallet = yield wallet_1.default.findOne({ owner_id: driver_id });
            if (!driver || !wallet)
                throw new Error("not_found");
            if (!((_a = driver.bank) === null || _a === void 0 ? void 0 : _a.recipient_code))
                throw new Error("no_bank_info");
            if (wallet.balance < amount)
                throw new Error("insufficient");
            // DEDUCT IMMEDIATELY (Safety first)
            wallet.balance -= amount;
            yield wallet.save();
            const transaction = yield transaction_1.default.create([
                {
                    wallet_id: wallet._id,
                    type: "payout",
                    status: "pending", // ALWAYS start as pending
                    amount,
                    channel: "bank",
                    reference: `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate your own ref first
                    metadata: { driver_id: req.user.id },
                },
            ]);
            return {
                transaction: transaction[0],
                recipient: driver.bank.recipient_code,
            };
        }));
        // 2. NOW CALL PAYSTACK (Outside the DB transaction)
        try {
            const transfer = yield axios_1.default.post("https://api.paystack.co/transfer", {
                source: "balance",
                amount: amount * 100,
                recipient: result.recipient,
                reason: "Igle Driver Withdrawal",
                reference: result.transaction.reference, // Pass the same ref to Paystack
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                },
            });
            // If we got here, Paystack accepted the request
            return res.json({
                msg: "Withdrawal initiated",
                transfer: transfer.data.data,
            });
        }
        catch (paystackErr) {
            console.error("Paystack API Error:", (_b = paystackErr.response) === null || _b === void 0 ? void 0 : _b.data);
            return res
                .status(502)
                .json({ msg: "Bank transfer failed. Balance restored." });
        }
    }
    catch (err) {
        res.status(400).json({ msg: err.message });
    }
    finally {
        session.endSession();
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
