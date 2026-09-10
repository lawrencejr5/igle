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
const RestaurantSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    name: { type: String, required: true },
    logo: { type: String, default: "" },
    banner: { type: String, default: "" },
    category_tags: { type: [String], default: [] },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    description: { type: String, default: "" },
    operating_hours: [
        {
            day: { type: String, required: true },
            open: { type: String, default: "08:00 AM" },
            close: { type: String, default: "10:00 PM" },
            closed: { type: Boolean, default: false },
        },
    ],
    location: {
        address: { type: String, default: "" },
        landmark: { type: String, default: "" },
        coordinates: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
                default: [3.3792, 6.5244],
            },
        },
        delivery_radius_km: { type: Number, default: 5 },
    },
    bank: {
        bank_name: { type: String, default: "" },
        account_number: { type: String, default: "" },
        account_name: { type: String, default: "" },
        bank_code: { type: String, default: "" },
        recipient_code: { type: String, default: "" },
    },
    verification: {
        government_id: { type: String, default: "" },
        cac_document: { type: String, default: "" },
        is_cac_verified: { type: Boolean, default: false },
    },
    is_online: { type: Boolean, default: false },
    is_verified: { type: Boolean, default: false },
    application: {
        type: String,
        enum: ["none", "pending", "rejected", "submitted", "approved"],
        default: "submitted",
    },
    rating: { type: Number, default: 5.0 },
    num_of_reviews: { type: Number, default: 0 },
    // Soft delete & block
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", default: null },
    is_blocked: { type: Boolean, default: false },
    blocked_at: { type: Date, default: null },
    blocked_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", default: null },
}, { timestamps: true });
RestaurantSchema.index({ "location.coordinates": "2dsphere" });
exports.default = mongoose_1.default.model("Restaurant", RestaurantSchema);
