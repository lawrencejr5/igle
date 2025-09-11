"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const SavedPlaceSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    place_header: { type: String, required: true },
    place_id: { type: String, required: true },
    place_name: { type: String, required: true },
    place_sub_name: { type: String, required: true },
    place_coords: { type: [Number, Number], required: true },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("SavedPlace", SavedPlaceSchema);
