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
exports.update_driver_application = exports.update_email = exports.update_name = exports.update_phone = exports.update_password = exports.remove_profile_pic = exports.upload_profile_pic = exports.get_user_data = exports.update_location = exports.google_auth = exports.login = exports.register = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const user_1 = __importDefault(require("../models/user"));
const wallet_1 = __importDefault(require("../models/wallet"));
const upload_1 = require("../middleware/upload");
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
        if (!user) {
            user = yield user_1.default.create({
                name,
                email,
                avatar: picture,
                provider: "google",
                google_id: sub,
            });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, jwt_secret, {
            expiresIn: "7d",
        });
        res.status(200).json({ user, token });
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
    try {
        const { id } = req.params;
        const { coordinates } = req.body;
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
        user.profile_pic = uploadedFile.url;
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
    var _a, _b;
    const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id; // assuming you attach user ID from auth middleware
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
        res.status(200).json({ msg: "Phone number updated successfully." });
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
        if (!fullname) {
            res.status(400).json({ msg: "Name is required." });
            return;
        }
        const user = yield user_1.default.findByIdAndUpdate(user_id, { name: fullname }, { new: true });
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({ msg: "Fullname updated successfully." });
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
        if (!email) {
            res.status(400).json({ msg: "Email is required." });
            return;
        }
        const user = yield user_1.default.findByIdAndUpdate(user_id, { email }, { new: true });
        if (!user) {
            res.status(404).json({ msg: "User not found." });
            return;
        }
        res.status(200).json({ msg: "Email updated successfully." });
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
