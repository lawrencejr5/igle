"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const RatingSchema = new mongoose_1.Schema({
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    review: {
        type: String,
        default: "",
    },
    ride: {
        type: mongoose_1.Types.ObjectId,
        ref: "Ride",
        required: true,
    },
    user: {
        type: mongoose_1.Types.ObjectId,
        ref: "User",
        required: true,
    },
    driver: {
        type: mongoose_1.Types.ObjectId,
        ref: "Driver",
        required: true,
    },
}, { timestamps: true });
const RatingModel = (0, mongoose_1.model)("Rating", RatingSchema);
exports.default = RatingModel;
