"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.admin_block_user = exports.admin_delete_user = exports.admin_edit_user = exports.admin_get_user = exports.admin_get_users = exports.send_test_push = exports.set_push_token = exports.update_driver_application = exports.update_email = exports.update_name = exports.update_phone = exports.update_password = exports.remove_profile_pic = exports.upload_profile_pic = exports.get_user_data = exports.update_location = exports.google_auth = exports.login = exports.register = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const user_1 = __importDefault(require("../models/user"));
const wallet_1 = __importDefault(require("../models/wallet"));
const ride_1 = __importDefault(require("../models/ride"));
const delivery_1 = __importDefault(require("../models/delivery"));
const transaction_1 = __importDefault(require("../models/transaction"));
const driver_1 = __importDefault(require("../models/driver"));
const saved_place_1 = __importDefault(require("../models/saved_place"));
const activity_1 = __importDefault(require("../models/activity"));
const report_1 = __importDefault(require("../models/report"));
const upload_1 = require("../middleware/upload");
const axios_1 = __importDefault(require("axios"));
const expo_push_1 = require("../utils/expo_push");
const jwt_secret = process.env.JWT_SECRET;
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, phone } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ msg: "All fields are required." });
            return;
        }
        const existing_user = yield user_1.default.findOne({ email });
        if (existing_user) {
            res.status(409).json({ msg: "User already exists." });
            return;
        }
        const hashed_password = yield bcryptjs_1.default.hash(password, yield bcryptjs_1.default.genSalt(10));
        const new_user = yield user_1.default.create({
            name,
            email,
            phone,
            password: hashed_password,
        });
        const token = jsonwebtoken_1.default.sign({ id: new_user._id }, jwt_secret, {
            expiresIn: "1d",
        });
        yield wallet_1.default.create({
            owner_id: new_user === null || new_user === void 0 ? void 0 : new_user._id,
            owner_type: "User",
            balance: 0,
        });
        res.status(201).json({ token, user: { id: new_user._id, name, email } });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ msg: "Email and password are required." });
            return;
        }
        const user = yield user_1.default.findOne({ email });
        if (!user || !user.password) {
            res.status(401).json({ msg: "Invalid credentials." });
            return;
        }
        // prevent login for soft-deleted accounts
        if (user.is_deleted) {
            return res.status(403).json({ msg: "Account has been deleted." });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ msg: "Invalid credentials." });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, jwt_secret, {
            expiresIn: "7d",
        });
        res.status(200).json({
            token,
            user: {
                id: user._id,
                username: user.name,
                email: user.email,
                phone: user.phone,
                is_driver: user.is_driver,
            },
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.login = login;
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Heuristic: fetch the image and check if it looks like a real photo.
// Returns true if content-type starts with image/ and size is > 2KB.
const imageLooksLikePhoto = (url) => __awaiter(void 0, void 0, void 0, function* () {
    if (!url)
        return false;
    try {
        const resp = yield axios_1.default.get(url, { responseType: "arraybuffer" });
        const contentType = resp.headers["content-type"] || "";
        const size = resp.data ? resp.data.byteLength || resp.data.length || 0 : 0;
        // If it's an image and reasonably sized (>2KB), treat as a photo
        return contentType.startsWith("image/") && size > 2048;
    }
    catch (err) {
        const m = (err === null || err === void 0 ? void 0 : err.message) || JSON.stringify(err);
        console.warn("imageLooksLikePhoto fetch failed:", m);
        // Be conservative: if we can't fetch, don't set the profile pic to avoid placeholders
        return false;
    }
});
const google_auth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokenId } = req.body;
    try {
        console.log("Token received:", tokenId);
        if (!tokenId) {
            res.status(401).json({ msg: "Token id not provided" });
            return;
        }
        const ticket = yield client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload) {
            res.status(400).json({ message: "Invalid Google token" });
            return;
        }
        const { email, name, picture, sub } = payload;
        let user = yield user_1.default.findOne({ email });
        let isNew = false;
        if (!user) {
            isNew = true;
            // create a new user and set profile picture from Google
            const shouldSetPic = yield imageLooksLikePhoto(picture);
            user = yield user_1.default.create({
                name,
                email,
                profile_pic: shouldSetPic ? picture : null,
                provider: "google",
                google_id: sub,
            });
            // create a wallet for the new user (register flow creates a wallet)
            try {
                yield wallet_1.default.create({
                    owner_id: user._id,
                    owner_type: "User",
                    balance: 0,
                });
            }
            catch (walletErr) {
                console.error("Failed to create wallet for google user:", walletErr);
            }
        }
        else {
            // existing user: if profile_pic is null/empty, set it from Google's picture
            // Do not overwrite an existing custom profile picture.
            if ((!user.profile_pic || user.profile_pic === null) && picture) {
                const shouldSetPic = yield imageLooksLikePhoto(picture);
                if (shouldSetPic)
                    user.profile_pic = picture;
            }
            user.google_id = sub || user.google_id;
            yield user.save();
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, jwt_secret, {
            expiresIn: "7d",
        });
        res.status(200).json({ user, token, isNew });
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({
            message: "Google sign-in failed",
            error: error.message || error,
        });
    }
});
exports.google_auth = google_auth;
// Update user location
const update_location = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // prevent blocked users from making changes
        const actingId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const actingUser = yield user_1.default.findById(actingId).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        const { coordinates } = req.body;
        if (!id) {
            return res.status(400).json({ msg: "id is required" });
        }
        const user = yield user_1.default.findByIdAndUpdate(id, { location: { type: "Point", coordinates } }, { new: true });
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({ msg: "User location updated successfully", user });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_location = update_location;
const get_user_data = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const user = yield user_1.default.findById(id).select("-password");
        res.status(200).json({ msg: "success", user });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_data = get_user_data;
const upload_profile_pic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const filePath = (_b = req.file) === null || _b === void 0 ? void 0 : _b.path;
    try {
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        if (!filePath)
            return res.status(404).json({ msg: "No file was found" });
        const uploadedFile = yield upload_1.cloudinary.uploader.upload(filePath, {
            folder: "igle_images/profile_pic",
        });
        const user = yield user_1.default.findById(user_id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        // Remove old profile pic from Cloudinary if it exists
        if (user.profile_pic_public_id) {
            yield upload_1.cloudinary.uploader.destroy(user.profile_pic_public_id);
        }
        user.profile_pic = uploadedFile.secure_url;
        user.profile_pic_public_id = uploadedFile.public_id;
        yield user.save();
        res.status(201).json({ msg: "Profile pic has been updated" });
    }
    catch (err) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.upload_profile_pic = upload_profile_pic;
const remove_profile_pic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id; // assuming you attach user ID from auth middleware
        const actingUser = yield user_1.default.findById(userId).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        const user = yield user_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (user.profile_pic) {
            const publicId = user.profile_pic_public_id;
            if (publicId)
                yield upload_1.cloudinary.uploader.destroy(publicId);
        }
        user.profile_pic = null;
        user.profile_pic_public_id = null;
        yield user.save();
        return res.json({ msg: "Profile pic removed", user });
    }
    catch (err) {
        res.status(500).json({ msg: "An error occured" });
    }
});
exports.remove_profile_pic = remove_profile_pic;
const update_password = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        const { old_password, new_password, confirm_password } = req.body;
        if (!old_password || !new_password || !confirm_password) {
            res.status(400).json({ msg: "All password fields are required." });
            return;
        }
        if (new_password !== confirm_password) {
            res.status(400).json({ msg: "New passwords do not match." });
            return;
        }
        const user = yield user_1.default.findById(user_id);
        if (!user || !user.password) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        const isMatch = yield bcryptjs_1.default.compare(old_password, user.password);
        if (!isMatch) {
            res.status(401).json({ msg: "Old password is incorrect." });
            return;
        }
        const hashed_password = yield bcryptjs_1.default.hash(new_password, yield bcryptjs_1.default.genSalt(10));
        user.password = hashed_password;
        yield user.save();
        res.status(200).json({ msg: "Password updated successfully." });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_password = update_password;
// Update user phone number
const update_phone = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        const { phone } = req.body;
        if (!phone) {
            res.status(400).json({ msg: "Phone number is required." });
            return;
        }
        const user = yield user_1.default.findByIdAndUpdate(user_id, { phone }, { new: true });
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({ msg: "Phone number updated successfully.", user });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_phone = update_phone;
const update_name = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { fullname } = req.query;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        if (!fullname) {
            res.status(400).json({ msg: "Name is required." });
            return;
        }
        const user = yield user_1.default.findByIdAndUpdate(user_id, { name: fullname }, { new: true });
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({ msg: "Fullname updated successfully.", user });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_name = update_name;
const update_email = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email } = req.query;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        if (!email) {
            res.status(400).json({ msg: "Email is required." });
            return;
        }
        const user = yield user_1.default.findByIdAndUpdate(user_id, { email }, { new: true });
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({ msg: "Email updated successfully.", user });
    }
    catch (err) {
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_email = update_email;
// Update user driver application status
const update_driver_application = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        const { driver_application } = req.body;
        if (driver_application === undefined) {
            res.status(400).json({ msg: "Driver application status is required." });
            return;
        }
        const user = yield user_1.default.findByIdAndUpdate(user_id, { driver_application }, { new: true }).select("-password");
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({
            msg: "Driver application status updated successfully.",
            status: user.driver_application,
        });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_driver_application = update_driver_application;
// Register or remove an Expo push token for the authenticated user
const set_push_token = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const actingUser = yield user_1.default.findById(user_id).select("is_blocked");
        if (actingUser === null || actingUser === void 0 ? void 0 : actingUser.is_blocked)
            return res.status(403).json({ msg: "Account is blocked." });
        const { token, action } = req.body; // action: 'add' | 'remove' (default: add)
        if (!token)
            return res.status(400).json({ msg: "No token provided." });
        const user = yield user_1.default.findById(user_id);
        if (!user)
            return res.status(404).json({ msg: "User not found." });
        // ensure array exists
        if (!Array.isArray(user.expo_push_tokens))
            user.expo_push_tokens = [];
        if (action === "remove") {
            user.expo_push_tokens = user.expo_push_tokens.filter((t) => t !== token);
            yield user.save();
            return res.json({ msg: "Push token removed." });
        }
        // default: add
        if (!user.expo_push_tokens.includes(token)) {
            user.expo_push_tokens.push(token);
            yield user.save();
        }
        return res.json({ msg: "Push token saved." });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.set_push_token = set_push_token;
// Send a test push to the authenticated user's registered Expo tokens
const send_test_push = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id)
            return res.status(401).json({ msg: "Unauthorized" });
        const { get_user_push_tokens } = yield Promise.resolve().then(() => __importStar(require("../utils/get_id")));
        const tokens = yield get_user_push_tokens(user_id);
        console.log("[test_push] tokens for user", user_id, tokens);
        if (!tokens || tokens.length === 0)
            return res
                .status(400)
                .json({ msg: "No push tokens registered for this user" });
        const result = yield (0, expo_push_1.sendNotification)([user_id], "Test Notification", "This is a test push from server", { type: "test_push" });
        console.log("[test_push] sendExpoPush result:", result);
        return res.json({ msg: "Test push sent", result });
    }
    catch (err) {
        console.error("send_test_push error:", err);
        return res.status(500).json({ msg: "Server error" });
    }
});
exports.send_test_push = send_test_push;
// Admin: fetch paginated list of users
const admin_get_users = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // admin only
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.max(1, Number(req.query.limit) || 20);
        const skip = (page - 1) * limit;
        const { include_deleted, status, search, dateFrom, dateTo } = req.query;
        const filter = {};
        // Status filter
        if (status) {
            if (status === "active")
                filter.is_active = true;
            else if (status === "suspended")
                filter.is_active = false;
            else if (status === "deleted")
                filter.is_deleted = true;
        }
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
        // Get all users for search
        let users = yield user_1.default.find(filter)
            .select("-password")
            .sort({ createdAt: -1 });
        // Apply search filter if provided
        if (search && search.trim()) {
            const searchLower = search.toLowerCase();
            users = users.filter((user) => {
                const name = (user.name || "").toLowerCase();
                const email = (user.email || "").toLowerCase();
                const phone = (user.phone || "").toLowerCase();
                const id = user._id.toString().toLowerCase();
                return (name.includes(searchLower) ||
                    email.includes(searchLower) ||
                    phone.includes(searchLower) ||
                    id.includes(searchLower));
            });
        }
        // Get total count and apply pagination
        const total = users.length;
        const paginatedUsers = users.slice(skip, skip + limit);
        // Get completed rides and deliveries count for each paginated user
        const usersWithCounts = yield Promise.all(paginatedUsers.map((user) => __awaiter(void 0, void 0, void 0, function* () {
            const [numRides, numDeliveries] = yield Promise.all([
                ride_1.default.countDocuments({ rider: user._id, status: "completed" }),
                delivery_1.default.countDocuments({ sender: user._id, status: "delivered" }),
            ]);
            return Object.assign(Object.assign({}, user.toObject()), { numRides,
                numDeliveries });
        })));
        const pages = Math.ceil(total / limit);
        return res
            .status(200)
            .json({ msg: "success", users: usersWithCounts, total, page, pages });
    }
    catch (err) {
        console.error("admin_get_users error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_users = admin_get_users;
// Admin: get user data including counts for rides and deliveries
const admin_get_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // admin only
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const user = yield user_1.default.findById(id).select("-password");
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        // respect soft-delete: if user is deleted, return 404 unless include_deleted=true
        const includeDeleted = req.query.include_deleted === "true";
        if (user.is_deleted && !includeDeleted) {
            return res.status(404).json({ msg: "User not found" });
        }
        const [numRides, numDeliveries] = yield Promise.all([
            ride_1.default.countDocuments({ rider: user._id, status: "completed" }),
            delivery_1.default.countDocuments({ sender: user._id, status: "delivered" }),
        ]);
        return res
            .status(200)
            .json({ msg: "success", user, numRides, numDeliveries });
    }
    catch (err) {
        console.error("admin_get_user error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_user = admin_get_user;
// Admin: edit user
const admin_edit_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const allowed = [
            "name",
            "email",
            "phone",
            "is_driver",
            "is_verified",
            "driver_application",
        ];
        const update = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined)
                update[key] = req.body[key];
        }
        if (Object.keys(update).length === 0)
            return res.status(400).json({ msg: "Nothing to update" });
        const user = yield user_1.default.findByIdAndUpdate(id, update, { new: true }).select("-password");
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        return res.status(200).json({ msg: "User updated", user });
    }
    catch (err) {
        console.error("admin_edit_user error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_edit_user = admin_edit_user;
// Admin: delete user and related data
const admin_delete_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const user = yield user_1.default.findById(id);
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        const soft = req.query.soft === "true" || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.soft) === true;
        if (soft) {
            // perform soft delete: mark user as deleted and record admin
            user.is_deleted = true;
            user.deleted_at = new Date();
            user.deleted_by = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
            yield user.save();
            return res.status(200).json({ msg: "User soft-deleted" });
        }
        // delete user's wallets and transactions
        const wallets = yield wallet_1.default.find({ owner_id: user._id });
        const walletIds = wallets.map((w) => w._id);
        if (walletIds.length) {
            yield transaction_1.default.deleteMany({ wallet_id: { $in: walletIds } });
            yield wallet_1.default.deleteMany({ _id: { $in: walletIds } });
        }
        // delete rides where user is rider
        yield ride_1.default.deleteMany({ rider: user._id });
        // delete deliveries where user is sender
        yield delivery_1.default.deleteMany({ sender: user._id });
        // delete saved places and activities and reports by user
        yield saved_place_1.default.deleteMany({ user: user._id });
        yield activity_1.default.deleteMany({ user: user._id });
        yield report_1.default.deleteMany({ reporter: user._id });
        // if user has a Driver record, remove driver and related data
        const driver = yield driver_1.default.findOne({ user: user._id });
        if (driver) {
            // driver wallet and transactions
            const dWallets = yield wallet_1.default.find({ owner_id: driver._id });
            const dWalletIds = dWallets.map((w) => w._id);
            if (dWalletIds.length) {
                yield transaction_1.default.deleteMany({ wallet_id: { $in: dWalletIds } });
                yield wallet_1.default.deleteMany({ _id: { $in: dWalletIds } });
            }
            yield ride_1.default.deleteMany({ driver: driver._id });
            yield delivery_1.default.deleteMany({ driver: driver._id });
            yield report_1.default.deleteMany({ driver: driver._id });
            yield driver_1.default.deleteOne({ _id: driver._id });
        }
        // finally delete user
        yield user_1.default.deleteOne({ _id: user._id });
        return res.status(200).json({ msg: "User and related data deleted" });
    }
    catch (err) {
        console.error("admin_delete_user error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_delete_user = admin_delete_user;
// Admin: block or unblock user
const admin_block_user = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        if (!id)
            return res.status(400).json({ msg: "id is required" });
        const block = ((_c = req.body) === null || _c === void 0 ? void 0 : _c.block) === true || ((_d = req.query) === null || _d === void 0 ? void 0 : _d.block) === "true";
        const user = yield user_1.default.findById(id);
        if (!user)
            return res.status(404).json({ msg: "User not found" });
        if (block) {
            user.is_blocked = true;
            user.blocked_at = new Date();
            user.blocked_by = (_e = req.user) === null || _e === void 0 ? void 0 : _e.id;
        }
        else {
            user.is_blocked = false;
            user.blocked_at = null;
            user.blocked_by = null;
        }
        yield user.save();
        return res
            .status(200)
            .json({ msg: block ? "User blocked" : "User unblocked" });
    }
    catch (err) {
        console.error("admin_block_user error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_block_user = admin_block_user;
