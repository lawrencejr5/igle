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
exports.get_app_wallet = exports.create_app_wallet = void 0;
const app_wallet_1 = __importDefault(require("../models/app_wallet"));
// Create the application wallet (singleton)
const create_app_wallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // only admins may create the app wallet
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== "admin") {
            return res
                .status(403)
                .json({ msg: "admin role required for this action" });
        }
        const existing = yield app_wallet_1.default.findOne({});
        if (existing) {
            return res
                .status(409)
                .json({ msg: "App wallet already exists", wallet: existing });
        }
        const { balance } = req.body;
        const initialBalance = typeof balance === "number" ? balance : 0;
        const wallet = yield app_wallet_1.default.create({ balance: initialBalance });
        return res.status(201).json({ msg: "App wallet created", wallet });
    }
    catch (err) {
        console.error("create_app_wallet error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.create_app_wallet = create_app_wallet;
// Get application wallet balance
const get_app_wallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
        if (role !== "admin") {
            return res
                .status(403)
                .json({ msg: "admin role required for this action" });
        }
        const wallet = yield app_wallet_1.default.findOne({});
        if (!wallet) {
            return res.status(404).json({ msg: "App wallet not found" });
        }
        return res.status(200).json({ msg: "success", wallet });
    }
    catch (err) {
        console.error("get_app_wallet error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.get_app_wallet = get_app_wallet;
