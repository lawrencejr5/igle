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
const DeliverySchema = new mongoose_1.Schema({
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: mongoose_1.Schema.Types.ObjectId, ref: "Driver" },
    pickup: {
        address: String,
        coordinates: [Number],
    },
    dropoff: {
        address: String,
        coordinates: [Number],
    },
    to: {
        name: String,
        phone: String,
    },
    package: {
        description: String,
        fragile: { type: Boolean, default: false },
        amount: Number,
        type: {
            type: String,
            enum: [
                "document",
                "electronics",
                "clothing",
                "food",
                "furniture",
                "other",
            ],
            default: "other",
        },
    },
    status: {
        type: String,
        enum: [
            "pending",
            "scheduled",
            "accepted",
            "arrived",
            "picked_up",
            "in_transit",
            "delivered",
            "failed",
            "cancelled",
            "expired",
        ],
        default: "pending",
    },
    fare: { type: Number, required: true },
    vehicle: {
        type: String,
        enum: ["bike", "cab", "van", "truck"],
        required: true,
    },
    payment_status: {
        type: String,
        enum: ["unpaid", "paid"],
        default: "unpaid",
    },
    payment_method: {
        type: String,
        enum: ["cash", "card", "wallet"],
        default: "cash",
    },
    timestamps: {
        accepted_at: Date,
        picked_up_at: Date,
        delivered_at: Date,
        cancelled_at: Date,
    },
    cancelled: {
        by: { type: String, enum: ["sender", "driver"] },
        reason: String,
    },
    driver_earnings: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    scheduled: { type: Boolean, default: false },
    scheduled_time: { type: Date, default: null },
}, { timestamps: true });
exports.default = mongoose_1.default.model("Delivery", DeliverySchema);
