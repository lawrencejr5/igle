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
exports.summary = exports.remove_profile_pic = exports.upload_profile_pic = exports.update_password = exports.update_profile = exports.get_admin_data = exports.login = exports.register = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const admin_1 = __importDefault(require("../models/admin"));
const user_1 = __importDefault(require("../models/user"));
const driver_1 = __importDefault(require("../models/driver"));
const ride_1 = __importDefault(require("../models/ride"));
const delivery_1 = __importDefault(require("../models/delivery"));
const report_1 = __importDefault(require("../models/report"));
const transaction_1 = __importDefault(require("../models/transaction"));
const upload_1 = require("../middleware/upload");
const jwt_secret = process.env.JWT_SECRET;
// Register a new admin
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            res.status(400).json({ msg: "All fields are required." });
            return;
        }
        const existing = yield admin_1.default.findOne({ email });
        if (existing) {
            res.status(409).json({ msg: "Admin already exists." });
            return;
        }
        const hashed = yield bcryptjs_1.default.hash(password, yield bcryptjs_1.default.genSalt(10));
        const admin = yield admin_1.default.create({ username, email, password: hashed });
        const token = jsonwebtoken_1.default.sign({ id: admin._id, email: admin.email, role: "admin" }, jwt_secret, {
            expiresIn: "7d",
        });
        res.status(201).json({
            token,
            admin: { id: admin._id, name: admin.username, email: admin.email },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.register = register;
// Login admin
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // allow clients to send `identifier` (email or username), or `email`, or `username`
        const { login_id, email, username, password } = req.body;
        const user = login_id || email || username;
        if (!user || !password) {
            res
                .status(400)
                .json({ msg: "Email/username and password are required." });
            return;
        }
        // find by email OR username
        const admin = yield admin_1.default.findOne({
            $or: [{ email: user }, { username: user }],
        });
        if (!admin || !admin.password) {
            res.status(401).json({ msg: "Invalid credentials." });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(password, admin.password);
        if (!isMatch) {
            res.status(401).json({ msg: "Invalid credentials." });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: admin._id, email: admin.email, role: "admin" }, jwt_secret, {
            expiresIn: "7d",
        });
        res.status(200).json({
            token,
            admin: { id: admin._id, username: admin.username, email: admin.email },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.login = login;
// Get authenticated admin data
const get_admin_data = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // only admins may call this
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        return res.status(403).json({ msg: "admin role required for this action" });
    }
    try {
        const id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const admin = yield admin_1.default.findById(id).select("-password");
        if (!admin)
            return res.status(404).json({ msg: "Admin not found." });
        res.status(200).json({ admin });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_admin_data = get_admin_data;
// Update profile (username/email)
const update_profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // only admins may call this
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        return res.status(403).json({ msg: "admin role required for this action" });
    }
    try {
        const id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const { username, email } = req.body;
        if (!username && !email) {
            res.status(400).json({ msg: "Nothing to update." });
            return;
        }
        const update = {};
        if (username)
            update.username = username;
        if (email)
            update.email = email;
        const admin = yield admin_1.default.findByIdAndUpdate(id, update, {
            new: true,
        }).select("-password");
        if (!admin)
            return res.status(404).json({ msg: "Admin not found." });
        res.status(200).json({ msg: "Profile updated.", admin });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_profile = update_profile;
// Update password
const update_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // only admins may call this
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        return res.status(403).json({ msg: "admin role required for this action" });
    }
    try {
        const id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const { old_password, new_password, confirm_password } = req.body;
        if (!old_password || !new_password || !confirm_password) {
            res.status(400).json({ msg: "All password fields are required." });
            return;
        }
        if (new_password !== confirm_password) {
            res.status(400).json({ msg: "New passwords do not match." });
            return;
        }
        const admin = yield admin_1.default.findById(id);
        if (!admin || !admin.password)
            return res.status(404).json({ msg: "Admin not found." });
        const isMatch = yield bcryptjs_1.default.compare(old_password, admin.password);
        if (!isMatch)
            return res.status(401).json({ msg: "Old password is incorrect." });
        admin.password = yield bcryptjs_1.default.hash(new_password, yield bcryptjs_1.default.genSalt(10));
        yield admin.save();
        res.status(200).json({ msg: "Password updated successfully." });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_password = update_password;
// Upload profile picture
const upload_profile_pic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    // only admins may call this
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        return res.status(403).json({ msg: "admin role required for this action" });
    }
    const admin_id = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
    const filePath = (_c = req.file) === null || _c === void 0 ? void 0 : _c.path;
    try {
        if (!filePath)
            return res.status(404).json({ msg: "No file was found" });
        const uploadedFile = yield upload_1.cloudinary.uploader.upload(filePath, {
            folder: "igle_images/admin_profile",
        });
        const admin = yield admin_1.default.findById(admin_id);
        if (!admin)
            return res.status(404).json({ msg: "Admin not found" });
        // remove old pic if exists
        if (admin.profile_pic_public_id) {
            try {
                yield upload_1.cloudinary.uploader.destroy(admin.profile_pic_public_id);
            }
            catch (err) {
                console.warn("Failed to destroy old admin profile pic", err);
            }
        }
        admin.profile_pic = uploadedFile.secure_url;
        admin.profile_pic_public_id = uploadedFile.public_id;
        yield admin.save();
        res.status(201).json({
            msg: "Profile pic has been updated",
            admin: { id: admin._id, profile_pic: admin.profile_pic },
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.upload_profile_pic = upload_profile_pic;
const remove_profile_pic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // only admins may call this
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        return res.status(403).json({ msg: "admin role required for this action" });
    }
    try {
        const adminId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        const admin = yield admin_1.default.findById(adminId);
        if (!admin)
            return res.status(404).json({ msg: "Admin not found" });
        if (admin.profile_pic_public_id) {
            try {
                yield upload_1.cloudinary.uploader.destroy(admin.profile_pic_public_id);
            }
            catch (err) {
                console.warn("Failed to destroy admin profile pic", err);
            }
        }
        admin.profile_pic = null;
        admin.profile_pic_public_id = null;
        yield admin.save();
        return res.json({ msg: "Profile pic removed", admin });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.remove_profile_pic = remove_profile_pic;
exports.default = {};
// Admin summary: totals and revenue this month
const summary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // ensure requester is admin
    const role = (_a = req.user) === null || _a === void 0 ? void 0 : _a.role;
    if (role !== "admin") {
        return res.status(403).json({ msg: "admin role required for this action" });
    }
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const [totalUsers, activeDrivers, activeRides, activeDeliveries, totalReports, revenueAgg,] = yield Promise.all([
            user_1.default.countDocuments({}),
            driver_1.default.countDocuments({ is_online: true }),
            ride_1.default.countDocuments({
                status: { $in: ["accepted", "arrived", "ongoing"] },
            }),
            delivery_1.default.countDocuments({
                status: { $in: ["accepted", "arrived", "picked_up", "in_transit"] },
            }),
            report_1.default.countDocuments({}),
            transaction_1.default.aggregate([
                {
                    $match: {
                        type: "payment",
                        status: "success",
                        createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);
        const totalRevenueThisMonth = (revenueAgg && revenueAgg[0] && revenueAgg[0].total) || 0;
        return res.status(200).json({
            totalUsers,
            activeDrivers,
            activeRides,
            activeDeliveries,
            totalReports,
            totalRevenueThisMonth,
        });
    }
    catch (err) {
        console.error("admin summary error:", err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.summary = summary;
