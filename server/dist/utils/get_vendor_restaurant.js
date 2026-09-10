"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendorRestaurant = void 0;
const restaurant_1 = __importDefault(require("../models/restaurant"));
/**
 * Helper to verify user authentication and restaurant ownership.
 * Returns the restaurant document if authenticated and found, or sends an HTTP error response and returns null.
 */
const getVendorRestaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!user_id) {
        res.status(401).json({ msg: "User not authenticated" });
        return null;
    }
    const restaurant = yield restaurant_1.default.findOne({
        user: user_id,
        is_deleted: { $ne: true },
    });
    if (!restaurant) {
        res.status(404).json({
            msg: "Restaurant profile not found. Please complete restaurant registration first.",
        });
        return null;
    }
    return restaurant;
});
exports.getVendorRestaurant = getVendorRestaurant;
