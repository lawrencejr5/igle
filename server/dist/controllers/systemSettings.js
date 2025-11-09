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
exports.update_system_settings = exports.get_system_settings = void 0;
const systemSetting_1 = __importDefault(require("../models/systemSetting"));
// Get system settings (create defaults if missing)
const get_system_settings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let settings = yield systemSetting_1.default.findOne();
        if (!settings) {
            settings = yield systemSetting_1.default.create({
                rideFare: {
                    baseFare: 500,
                    costPerKm: 150,
                    costPerMinute: 50,
                    minimumFare: 800,
                    commissionRate: 15,
                    cancellationFee: 300,
                },
                deliveryFare: {
                    baseDeliveryFee: 600,
                    costPerKm: 100,
                    weightBasedFee: 200,
                    minimumDeliveryFee: 1000,
                },
            });
        }
        return res.status(200).json({ msg: "success", settings });
    }
    catch (err) {
        console.error("get_system_settings error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.get_system_settings = get_system_settings;
// Update settings (admin only)
const update_system_settings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const payload = req.body || {};
        const update = {};
        if (payload.rideFare)
            update.rideFare = payload.rideFare;
        if (payload.deliveryFare)
            update.deliveryFare = payload.deliveryFare;
        const settings = yield systemSetting_1.default.findOneAndUpdate({}, update, {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
        });
        return res.status(200).json({ msg: "Settings updated", settings });
    }
    catch (err) {
        console.error("update_system_settings error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.update_system_settings = update_system_settings;
exports.default = {};
