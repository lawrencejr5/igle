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
const FoodOrderSchema = new mongoose_1.Schema({
    order_number: {
        type: String,
        required: true,
        unique: true,
    },
    customer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    restaurant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true,
    },
    driver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Driver",
        default: null,
    },
    items: [
        {
            menu_item_id: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "MenuItem",
                required: true,
            },
            name: { type: String, required: true },
            image: { type: String, default: "" },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true, min: 1 },
            selected_options: [
                {
                    group_name: { type: String, required: true },
                    option_name: { type: String, required: true },
                    price_modifier: { type: Number, default: 0 },
                },
            ],
            special_instructions: { type: String, default: "" },
            item_total: { type: Number, required: true },
        },
    ],
    delivery_address: {
        address: { type: String, required: true },
        landmark: { type: String, default: "" },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
        },
        contact_name: { type: String, required: true },
        contact_phone: { type: String, required: true },
    },
    restaurant_address: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        coordinates: {
            type: [Number],
            required: true,
        },
        phone: { type: String, required: true },
    },
    pricing: {
        subtotal: { type: Number, required: true },
        delivery_fee: { type: Number, required: true, default: 0 },
        service_fee: { type: Number, required: true, default: 0 },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
        restaurant_earnings: { type: Number, default: 0 },
        driver_earnings: { type: Number, default: 0 },
        platform_commission: { type: Number, default: 0 },
    },
    payment: {
        method: {
            type: String,
            enum: ["cash", "card", "wallet"],
            required: true,
        },
        status: {
            type: String,
            enum: ["unpaid", "paid", "refunded"],
            default: "unpaid",
        },
        transaction_reference: { type: String, default: "" },
    },
    status: {
        type: String,
        enum: [
            "placed",
            "preparing",
            "ready_for_pickup",
            "in_transit",
            "delivered",
            "cancelled",
            "rejected",
        ],
        default: "placed",
    },
    cancellation: {
        cancelled_by: {
            type: String,
            enum: ["customer", "restaurant", "driver", "system", "admin"],
        },
        reason: { type: String, default: "" },
    },
    status_timestamps: {
        placed_at: { type: Date, default: null },
        preparing_at: { type: Date, default: null },
        ready_at: { type: Date, default: null },
        in_transit_at: { type: Date, default: null },
        delivered_at: { type: Date, default: null },
        cancelled_at: { type: Date, default: null },
    },
}, { timestamps: true });
FoodOrderSchema.index({ customer: 1, createdAt: -1 });
FoodOrderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
FoodOrderSchema.index({ driver: 1, status: 1 });
exports.default = mongoose_1.default.model("FoodOrder", FoodOrderSchema);
