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
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    ride: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Ride",
    },
    driver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Driver",
    },
    food_order: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "FoodOrder",
    },
    restaurant: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Restaurant",
    },
}, { timestamps: true });
RatingSchema.index({ driver: 1 });
RatingSchema.index({ restaurant: 1 });
RatingSchema.index({ ride: 1 });
RatingSchema.index({ food_order: 1 });
const RatingModel = (0, mongoose_1.model)("Rating", RatingSchema);
exports.default = RatingModel;
