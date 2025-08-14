"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate_commission = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PERCENTAGE = Number(process.env.COMMISSION_PERCENT);
const calculate_commission = (fare) => {
    return Math.round((PERCENTAGE / 100) * fare);
};
exports.calculate_commission = calculate_commission;
