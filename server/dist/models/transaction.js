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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TransactionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: ["funding", "payment", "payout"],
        required: true,
    },
    wallet_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Wallet",
        required: true,
    },
    ride_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Ride",
        required: function () {
            return this.type === "payment";
        },
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
    },
    channel: {
        type: String,
        enum: ["card", "transfer", "cash", "wallet"],
        required: true,
    },
    reference: { type: String, unique: true },
    metadata: { type: mongoose_1.Schema.Types.Mixed }, // any extra info (e.g., driver id, transfer details)
}, { timestamps: true });
exports.default = mongoose_1.default.model("Transaction", TransactionSchema);
