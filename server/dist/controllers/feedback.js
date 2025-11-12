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
exports.get_feedback_detail = exports.delete_feedback = exports.get_all_feedbacks = exports.get_user_feedbacks = exports.add_feedback = void 0;
const fs_1 = __importDefault(require("fs"));
const feedback_1 = __importDefault(require("../models/feedback"));
const upload_file_1 = require("../utils/upload_file");
// Submit feedback (authenticated users only)
const add_feedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { type, message, images, contact, metadata } = req.body;
        // If multer attached files, upload them to cloudinary and collect URLs
        let uploadedImageUrls = [];
        const files = req.files;
        if (files && Array.isArray(files) && files.length) {
            const uploads = yield Promise.all(files.map((f) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const resu = yield (0, upload_file_1.uploadToCloudinary)(f.path, "feedback");
                    // delete local file
                    try {
                        fs_1.default.unlinkSync(f.path);
                    }
                    catch (e) {
                        /* ignore */
                    }
                    return (resu === null || resu === void 0 ? void 0 : resu.url) || null;
                }
                catch (e) {
                    console.error("Failed to upload feedback image:", e);
                    return null;
                }
            })));
            uploadedImageUrls = uploads.filter(Boolean);
        }
        if (!type || !message) {
            res.status(400).json({ msg: "Type and message are required." });
            return;
        }
        const feedback = yield feedback_1.default.create({
            user: user_id ? user_id : undefined,
            type,
            message,
            images: uploadedImageUrls.length ? uploadedImageUrls : images || [],
            contact,
            metadata: metadata || {},
        });
        res.status(201).json({ msg: "Feedback submitted successfully.", feedback });
    }
    catch (err) {
        console.error(err);
        res
            .status(500)
            .json({ msg: "Failed to submit feedback.", err: err.message });
    }
});
exports.add_feedback = add_feedback;
// Get feedbacks submitted by the authenticated user
const get_user_feedbacks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const feedbacks = yield feedback_1.default.find({ user: user_id }).sort({
            createdAt: -1,
        });
        res
            .status(200)
            .json({ msg: "success", rowCount: feedbacks.length, feedbacks });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_feedbacks = get_user_feedbacks;
// (Optional) Get all feedbacks for admin/audit
const get_all_feedbacks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // Admin-only paginated listing
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const { type, user, search, dateFrom, dateTo } = req.query;
        const filter = {};
        if (type)
            filter.type = type;
        if (user)
            filter.user = user;
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
        // Get all feedbacks with populated data for search
        let feedbacks = yield feedback_1.default.find(filter)
            .sort({ createdAt: -1 })
            .populate("user", "name email phone");
        // Apply search filter if provided
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            feedbacks = feedbacks.filter((feedback) => {
                var _a, _b;
                const id = feedback._id.toString().toLowerCase();
                const userName = (((_a = feedback.user) === null || _a === void 0 ? void 0 : _a.name) || "").toLowerCase();
                const userEmail = (((_b = feedback.user) === null || _b === void 0 ? void 0 : _b.email) || "").toLowerCase();
                const message = (feedback.message || "").toLowerCase();
                const feedbackType = (feedback.type || "").toLowerCase();
                const contact = (feedback.contact || "").toLowerCase();
                return (id.includes(searchLower) ||
                    userName.includes(searchLower) ||
                    userEmail.includes(searchLower) ||
                    message.includes(searchLower) ||
                    feedbackType.includes(searchLower) ||
                    contact.includes(searchLower));
            });
        }
        // Get total count and apply pagination
        const total = feedbacks.length;
        const paginatedFeedbacks = feedbacks.slice(skip, skip + limit);
        const pages = Math.ceil(total / limit);
        return res
            .status(200)
            .json({
            msg: "success",
            feedbacks: paginatedFeedbacks,
            total,
            page,
            pages,
        });
    }
    catch (err) {
        console.error("get_all_feedbacks error:", err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_all_feedbacks = get_all_feedbacks;
// Admin: delete feedback
const delete_feedback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || req.body.id || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const deleted = yield feedback_1.default.findByIdAndDelete(id);
        if (!deleted)
            return res.status(404).json({ msg: "Feedback not found" });
        return res.status(200).json({ msg: "Feedback deleted" });
    }
    catch (err) {
        console.error("delete_feedback error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.delete_feedback = delete_feedback;
// Admin: get feedback detail
const get_feedback_detail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || req.body.id || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const feedback = yield feedback_1.default.findById(id).populate("user", "name email phone profile_pic");
        if (!feedback)
            return res.status(404).json({ msg: "Feedback not found" });
        return res.status(200).json({ msg: "success", feedback });
    }
    catch (err) {
        console.error("get_feedback_detail error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.get_feedback_detail = get_feedback_detail;
