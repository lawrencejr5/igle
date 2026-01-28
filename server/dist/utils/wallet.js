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
const mongoose_1 = __importDefault(require("mongoose"));
const get_id_1 = require("./get_id");
const activity_1 = __importDefault(require("../models/activity"));
const expo_push_1 = require("./expo_push");
const credit_wallet = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    try {
        const result = yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = yield transaction_1.default.findOne({ reference });
            if (!transaction)
                throw new Error("Transaction was not found");
            if (transaction.status !== "pending") {
                return { balance: null, transaction, alreadyProcessed: true };
            }
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
        }));
        if (result && !result.alreadyProcessed) {
            const transaction = result.transaction;
            // Look up the user's push tokens using the wallet_id from the transaction
            const walletId = transaction === null || transaction === void 0 ? void 0 : transaction.wallet_id;
            if (walletId) {
                const wallet = yield wallet_1.default.findById(walletId).select("owner_id owner_type");
                if (wallet) {
                    const ownerId = wallet.owner_id;
                    let tokens = [];
                    tokens = yield (0, get_id_1.get_user_push_tokens)(ownerId);
                    yield activity_1.default.create({
                        type: "wallet_funding",
                        user: wallet.owner_id,
                        title: "Wallet funded",
                        message: `Your wallet was creditted with NGN ${transaction.amount}`,
                        metadata: { owner_id: ownerId },
                    });
                    if (tokens.length) {
                        yield (0, expo_push_1.sendNotification)([wallet.owner_id.toString()], "Wallet funded", `Your wallet was credited with ${transaction.amount}`, {
                            type: "wallet_funded",
                            reference: transaction.reference,
                        });
                    }
                }
            }
        }
        return result;
    }
    catch (err) {
        console.log("Credit wallet tranaction failed: " + err);
        throw err;
    }
    finally {
        session.endSession();
    }
});
exports.credit_wallet = credit_wallet;
const debit_wallet = (_a) => __awaiter(void 0, [_a], void 0, function* ({ wallet_id, ride_id, delivery_id, type, amount, reference, status = "success", metadata, }) {
    const session = yield mongoose_1.default.startSession();
    try {
        const result = yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            const idem_check = yield transaction_1.default.findOne({ reference });
            if (idem_check && idem_check.status === "success") {
                return {
                    balance: null,
                    transaction: idem_check,
                    already_processed: true,
                };
            }
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
        }));
        return result;
    }
    catch (err) {
        console.log("Debit wallet transaction failed: ", err);
        throw err;
    }
    finally {
        session.endSession();
    }
});
exports.debit_wallet = debit_wallet;
