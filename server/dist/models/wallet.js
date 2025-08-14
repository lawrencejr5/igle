"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const WalletSchema = new mongoose_1.Schema({
    owner_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        refPath: "owner_type",
        required: true,
        unique: true,
    },
    owner_type: {
        type: String,
        enum: ["User", "Driver"],
    },
    balance: { type: Number, default: 0 },
}, { timestamps: true });
exports.default = (0, mongoose_1.model)("Wallet", WalletSchema);
