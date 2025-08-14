"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AppWalletSchema = new mongoose_1.Schema({
    balance: { type: Number, default: 0 },
}, { timestamps: true });
const AppWallet = (0, mongoose_1.model)("AppWallet", AppWalletSchema);
exports.default = AppWallet;
