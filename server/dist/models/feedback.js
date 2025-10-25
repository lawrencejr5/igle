"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const FeedbackSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: false,
    },
    type: {
        type: String,
        enum: ["bug", "feature", "general"],
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    images: {
        type: [String],
        default: [],
    },
    contact: {
        type: String,
        required: false,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
const FeedbackModel = (0, mongoose_1.model)("Feedback", FeedbackSchema);
exports.default = FeedbackModel;
