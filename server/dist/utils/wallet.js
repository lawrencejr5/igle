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
exports.debit_wallet = exports.credit_wallet = void 0;
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const credit_wallet = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    const transaction = yield transaction_1.default.findOne({ reference });
    if (!transaction)
        throw new Error("Transaction was not found");
    if (transaction.status !== "pending")
        throw new Error("This transaction has already been processed");
    const wallet_id = transaction === null || transaction === void 0 ? void 0 : transaction.wallet_id;
    const wallet = yield wallet_1.default.findById(wallet_id);
    if (!wallet)
        throw new Error("Wallet not found");
    const amount = transaction === null || transaction === void 0 ? void 0 : transaction.amount;
    wallet.balance += amount;
    yield wallet.save();
    transaction.status = "success";
    yield transaction.save();
    return { balance: wallet.balance, transaction };
});
exports.credit_wallet = credit_wallet;
const debit_wallet = (_a) => __awaiter(void 0, [_a], void 0, function* ({ wallet_id, ride_id, delivery_id, type, amount, reference, status = "success", metadata, }) {
    const wallet = yield wallet_1.default.findById(wallet_id);
    if (!wallet)
        throw new Error("no_wallet");
    if (wallet.balance < amount)
        throw new Error("insufficient");
    wallet.balance -= amount;
    yield wallet.save();
    const transaction = yield transaction_1.default.create({
        wallet_id,
        type,
        amount,
        status,
        channel: "wallet",
        ride_id: ride_id && ride_id,
        delivery_id: delivery_id && delivery_id,
        reference,
        metadata,
    });
    return { balance: wallet.balance, transaction };
});
exports.debit_wallet = debit_wallet;
