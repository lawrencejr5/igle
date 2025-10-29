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
exports.get_reports = exports.create_report = void 0;
const report_1 = __importDefault(require("../models/report"));
// Create a new report
const create_report = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { driver_id, ride_id, category, description, anonymous } = req.body;
        if (!driver_id || !category) {
            res.status(400).json({ msg: "driver_id and category are required." });
            return;
        }
        const report = yield report_1.default.create({
            reporter: anonymous ? null : user_id || null,
            driver: driver_id,
            ride: ride_id || null,
            category,
            description: description || "",
            anonymous: !!anonymous,
            status: "new",
        });
        res.status(201).json({ msg: "Report submitted.", report });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Failed to submit report.", err: err.message });
    }
});
exports.create_report = create_report;
// (Optional) Get reports - for admin/ops (basic implementation)
const get_reports = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reports = yield report_1.default.find().sort({ createdAt: -1 }).limit(100);
        res.status(200).json({ msg: "success", rowCount: reports.length, reports });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_reports = get_reports;
