"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculate_fare = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const calculate_fare = (distance_km, duration_min) => {
    if (isNaN(distance_km) || isNaN(duration_min))
        throw new Error("Distance or duration isNan");
    const BASE_FARE = Number(process.env.BASE_FARE);
    const PRICE_PER_KM = Number(process.env.PRICE_PER_KM);
    const PRICE_PER_MIN = Number(process.env.PRICE_PER_MIN);
    if ([BASE_FARE, PRICE_PER_KM, PRICE_PER_MIN].some(isNaN)) {
        throw new Error("One or more fare configuration values are missing or invalid");
    }
    const fare = BASE_FARE + distance_km * PRICE_PER_KM + duration_min * PRICE_PER_MIN;
    return Math.ceil(fare / 10) * 10;
};
exports.calculate_fare = calculate_fare;
