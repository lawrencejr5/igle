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
exports.get_report_detail = exports.delete_report = exports.update_report_status = exports.get_reports = exports.create_report = void 0;
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
    var _a;
    // Admin-only paginated listing
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const { status, category, reporter, search, dateFrom, dateTo } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (category)
            filter.category = category;
        if (reporter)
            filter.reporter = reporter;
        // Date range filters
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) {
                filter.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDate;
            }
        }
        // Get all reports with populated data for search
        let reports = yield report_1.default.find(filter)
            .sort({ createdAt: -1 })
            .populate("reporter", "name email phone")
            .populate({
            path: "driver",
            select: "user",
            populate: { path: "user", select: "name" },
        });
        // Apply search filter if provided
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            reports = reports.filter((report) => {
                var _a, _b, _c, _d;
                const id = report._id.toString().toLowerCase();
                const reporterName = (((_a = report.reporter) === null || _a === void 0 ? void 0 : _a.name) || "").toLowerCase();
                const reporterEmail = (((_b = report.reporter) === null || _b === void 0 ? void 0 : _b.email) || "").toLowerCase();
                const driverName = (((_d = (_c = report.driver) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || "").toLowerCase();
                const description = (report.description || "").toLowerCase();
                const reportCategory = (report.category || "").toLowerCase();
                const reportStatus = (report.status || "").toLowerCase();
                return (id.includes(searchLower) ||
                    reporterName.includes(searchLower) ||
                    reporterEmail.includes(searchLower) ||
                    driverName.includes(searchLower) ||
                    description.includes(searchLower) ||
                    reportCategory.includes(searchLower) ||
                    reportStatus.includes(searchLower));
            });
        }
        // Get total count and apply pagination
        const total = reports.length;
        const paginatedReports = reports.slice(skip, skip + limit);
        const pages = Math.ceil(total / limit);
        return res
            .status(200)
            .json({ msg: "success", reports: paginatedReports, total, page, pages });
    }
    catch (err) {
        console.error("get_reports error:", err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_reports = get_reports;
// Admin: update report status
const update_report_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.body.id || req.query.id || "");
        const { status } = req.body;
        if (!id || !status)
            return res.status(400).json({ msg: "id and status are required" });
        const report = yield report_1.default.findByIdAndUpdate(id, { status }, { new: true })
            .populate("reporter", "name email phone")
            .populate("driver", "user");
        if (!report)
            return res.status(404).json({ msg: "Report not found" });
        return res.status(200).json({ msg: "Report updated", report });
    }
    catch (err) {
        console.error("update_report_status error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.update_report_status = update_report_status;
// Admin: delete a report
const delete_report = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.body.id || req.query.id || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const deleted = yield report_1.default.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ msg: "Report not found" });
        return res.status(200).json({ msg: "Report deleted" });
    }
    catch (err) {
        console.error("delete_report error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.delete_report = delete_report;
// Admin: get report detail
const get_report_detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || req.body.id || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const report = yield report_1.default.findById(id)
            .populate("reporter", "name email phone profile_pic")
            .populate("driver", "user")
            .populate("ride", "pickup destination fare");
        if (!report)
            return res.status(404).json({ msg: "Report not found" });
        return res.status(200).json({ msg: "success", report });
    }
    catch (err) {
        console.error("get_report_detail error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.get_report_detail = get_report_detail;
