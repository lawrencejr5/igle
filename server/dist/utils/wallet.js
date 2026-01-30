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
const activity_1 = __importDefault(require("../models/activity"));
const expo_push_1 = require("./expo_push");
const credit_wallet = (reference, ext_session) => __awaiter(void 0, void 0, void 0, function* () {
    // Determine if we are managing the session or borrowing it
    const isLocalSession = !ext_session;
    const session = ext_session || (yield mongoose_1.default.startSession());
    try {
        // Define the core DB work (so we don't duplicate code)
        const executeLogic = () => __awaiter(void 0, void 0, void 0, function* () {
            const transaction = yield transaction_1.default.findOne({ reference }).session(session);
            if (!transaction)
                throw new Error("Transaction was not found");
            // Idempotency check
            if (transaction.status !== "pending") {
                return { balance: null, transaction, alreadyProcessed: true };
            }
            const wallet = yield wallet_1.default.findById(transaction.wallet_id).session(session);
            if (!wallet)
                throw new Error("Wallet not found");
            const amount = transaction.amount;
            // Update Balance
            wallet.balance += amount;
            yield wallet.save({ session });
            // Update Transaction
            transaction.status = "success";
            yield transaction.save({ session });
            return { balance: wallet.balance, transaction, alreadyProcessed: false };
        });
        let result;
        if (isLocalSession) {
            result = yield session.withTransaction(executeLogic);
        }
        else {
            result = yield executeLogic();
        }
        if (isLocalSession && result && !result.alreadyProcessed) {
            yield notifyUserOfCredit(result.transaction);
        }
        return result;
    }
    catch (err) {
        console.log("Credit wallet transaction failed: " + err);
        throw err;
    }
    finally {
        if (isLocalSession) {
            session.endSession();
        }
    }
});
exports.credit_wallet = credit_wallet;
// Extracted helper to keep the main function clean
const notifyUserOfCredit = (transaction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wallet = yield wallet_1.default.findById(transaction.wallet_id).select("owner_id owner_type");
        if (!wallet)
            return;
        yield activity_1.default.create({
            type: "wallet_funding",
            user: wallet.owner_id,
            title: "Wallet funded",
            message: `Your wallet was credited with NGN ${transaction.amount}`,
            metadata: { owner_id: wallet.owner_id },
        });
        yield (0, expo_push_1.sendNotification)([wallet.owner_id.toString()], "Wallet funded", `Your wallet was credited with ${transaction.amount}`, {
            type: "wallet_funded",
            reference: transaction.reference,
        });
    }
    catch (e) {
        console.error("Failed to send wallet credit notification:", e);
    }
});
const debit_wallet = (_a, ext_session_1) => __awaiter(void 0, [_a, ext_session_1], void 0, function* ({ wallet_id, ride_id, delivery_id, type, amount, reference, status = "success", metadata, }, ext_session) {
    //  Determine ownership
    const isLocalSession = !ext_session;
    const session = ext_session || (yield mongoose_1.default.startSession());
    try {
        // Define the logic
        const executeLogic = () => __awaiter(void 0, void 0, void 0, function* () {
            // Pass session to the query
            const idem_check = yield transaction_1.default.findOne({ reference }).session(session);
            if (idem_check && idem_check.status === "success") {
                return {
                    balance: null,
                    transaction: idem_check,
                    already_processed: true,
                };
            }
            // Pass session to the query
            const wallet = yield wallet_1.default.findById(wallet_id).session(session);
            if (!wallet)
                throw new Error("no_wallet");
            if (wallet.balance < amount)
                throw new Error("insufficient");
            // Update wallet balance
            wallet.balance -= amount;
            yield wallet.save({ session });
            // Create Transaction Record
            const [transaction] = yield transaction_1.default.create([
                {
                    wallet_id,
                    type,
                    amount,
                    status,
                    channel: "wallet",
                    ride_id: ride_id && ride_id,
                    delivery_id: delivery_id && delivery_id,
                    reference,
                    metadata,
                },
            ], { session });
            return { balance: wallet.balance, transaction, already_processed: false };
        });
        // 4. Run based on ownership
        let result;
        if (isLocalSession) {
            // Standalone: We wrap it in a transaction
            result = yield session.withTransaction(executeLogic);
        }
        else {
            // Nested: We just run the logic (Parent handles commit/abort)
            result = yield executeLogic();
        }
        return result;
    }
    catch (err) {
        console.log("Debit wallet transaction failed: ", err);
        throw err;
    }
    finally {
        // 5. Only end session if WE started it
        if (isLocalSession) {
            session.endSession();
        }
    }
});
exports.debit_wallet = debit_wallet;
