"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// models/Commission.ts
const CommissionSchema = new mongoose_1.Schema({
    ride_id: { type: mongoose_1.Schema.Types.ObjectId, ref: "Ride", required: true },
    amount: { type: Number, required: true },
    credited: { type: Boolean, default: false },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Commission", CommissionSchema);
