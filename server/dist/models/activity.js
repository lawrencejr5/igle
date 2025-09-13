"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ActivitySchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: [
            "ride",
            "cancelled_ride",
            "scheduled_ride",
            "wallet_funding",
            "ride_payment",
            "system",
            "security",
            "phone_update",
            "email_update",
        ],
        required: true,
    },
    user: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed, // allows any object
        default: {},
    },
    is_read: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const ActivityModel = (0, mongoose_1.model)("Activity", ActivitySchema);
exports.default = ActivityModel;
