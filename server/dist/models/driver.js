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
const DriverSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    profile_img: String,
    socket_id: { type: String, default: null },
    vehicle_type: {
        type: String,
        enum: ["bike", "keke", "cab", "suv", "van", "truck"],
        required: true,
    },
    vehicle: {
        exterior_image: { type: String },
        interior_image: { type: String },
        brand: { type: String },
        model: { type: String },
        color: { type: String },
        year: { type: String },
        plate_number: { type: String },
    },
    driver_licence: {
        number: { type: String },
        expiry_date: { type: String },
        front_image: { type: String },
        back_image: { type: String },
        selfie_with_licence: { type: String },
    },
    bank: {
        bank_name: String,
        account_number: String,
        account_name: String,
        bank_code: String,
        recipient_code: String,
    },
    date_of_birth: { type: String },
    is_online: { type: Boolean, default: false },
    is_available: { type: Boolean, default: true },
    current_location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
        },
        coordinates: {
            type: [Number],
            default: [0, 0],
        },
    },
    rating: { type: Number, default: 5 },
    total_trips: { type: Number, default: 0 },
    num_of_reviews: { type: Number, default: 0 },
    application: {
        type: String,
        enum: ["none", "submitted", "rejected", "approved"],
        default: "none",
    },
    // admin fields for soft-delete and blocking
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: undefined },
    deleted_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", default: undefined },
    is_blocked: { type: Boolean, default: false },
    blocked_at: { type: Date, default: undefined },
    blocked_by: { type: mongoose_1.Schema.Types.ObjectId, ref: "Admin", default: undefined },
});
DriverSchema.index({ current_location: "2dsphere" });
exports.default = mongoose_1.default.model("Driver", DriverSchema);
