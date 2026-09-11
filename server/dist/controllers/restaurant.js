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
exports.get_restaurant_by_id = exports.get_all_restaurants = exports.set_restaurant_online_status = exports.get_restaurant_profile = exports.register_restaurant = exports.submit_restaurant_verification = exports.save_restaurant_bank = exports.save_restaurant_location = exports.save_restaurant_details = void 0;
const restaurant_1 = __importDefault(require("../models/restaurant"));
const user_1 = __importDefault(require("../models/user"));
const upload_1 = require("../middleware/upload");
const paystack_1 = require("../utils/paystack");
// Helper for uploading file buffer or file path to Cloudinary
const uploadToCloudinary = (filePath_1, ...args_1) => __awaiter(void 0, [filePath_1, ...args_1], void 0, function* (filePath, folder = "restaurants") {
    const result = yield upload_1.cloudinary.uploader.upload(filePath, { folder });
    return result.secure_url;
});
// ─── Stage 1: Save Restaurant Details ───────────────────────────────────────
// POST /api/v1/restaurants/save-details
const save_restaurant_details = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { name, phone, email, description, category_tags, operating_hours, } = req.body;
        const files = req.files;
        let logo_url = "";
        let banner_url = "";
        if ((_b = files === null || files === void 0 ? void 0 : files.logo) === null || _b === void 0 ? void 0 : _b[0]) {
            logo_url = yield uploadToCloudinary(files.logo[0].path, "restaurants/logos");
        }
        if ((_c = files === null || files === void 0 ? void 0 : files.banner) === null || _c === void 0 ? void 0 : _c[0]) {
            banner_url = yield uploadToCloudinary(files.banner[0].path, "restaurants/banners");
        }
        let parsedHours = operating_hours;
        if (typeof operating_hours === "string") {
            try {
                parsedHours = JSON.parse(operating_hours);
            }
            catch (e) {
                parsedHours = [];
            }
        }
        let parsedTags = category_tags;
        if (typeof category_tags === "string") {
            try {
                parsedTags = JSON.parse(category_tags);
            }
            catch (e) {
                parsedTags = category_tags.split(",").map((t) => t.trim());
            }
        }
        let restaurant = yield restaurant_1.default.findOne({ user: user_id });
        if (restaurant) {
            if (name)
                restaurant.name = name;
            if (phone)
                restaurant.phone = phone;
            if (email)
                restaurant.email = email;
            if (description !== undefined)
                restaurant.description = description;
            if (parsedTags)
                restaurant.category_tags = parsedTags;
            if (parsedHours)
                restaurant.operating_hours = parsedHours;
            if (logo_url)
                restaurant.logo = logo_url;
            if (banner_url)
                restaurant.banner = banner_url;
            if (!((_d = restaurant.verification) === null || _d === void 0 ? void 0 : _d.government_id) && restaurant.application !== "approved") {
                restaurant.application = "pending";
            }
            yield restaurant.save();
        }
        else {
            restaurant = yield restaurant_1.default.create({
                user: user_id,
                name: name || "Restaurant",
                phone: phone || "",
                email: email || "",
                description: description || "",
                category_tags: parsedTags || [],
                operating_hours: parsedHours || [],
                logo: logo_url,
                banner: banner_url,
                location: {
                    address: "",
                    landmark: "",
                    coordinates: {
                        type: "Point",
                        coordinates: [3.3792, 6.5244],
                    },
                    delivery_radius_km: 5,
                },
                verification: {
                    government_id: "",
                    cac_document: "",
                    is_cac_verified: false,
                },
                application: "pending",
            });
        }
        yield user_1.default.findByIdAndUpdate(user_id, {
            restaurant_application: "pending",
        });
        return res.status(200).json({
            msg: "Restaurant details saved successfully",
            restaurant,
        });
    }
    catch (error) {
        console.error("save_restaurant_details error:", error);
        return res
            .status(500)
            .json({ msg: error.message || "Failed to save restaurant details" });
    }
});
exports.save_restaurant_details = save_restaurant_details;
// ─── Stage 2: Save Restaurant Location ──────────────────────────────────────
// POST /api/v1/restaurants/save-location
const save_restaurant_location = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { address, landmark, latitude, longitude, delivery_radius_km } = req.body;
        let restaurant = yield restaurant_1.default.findOne({ user: user_id });
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant profile not found. Please complete step 1 first." });
        }
        const coords = [
            longitude ? parseFloat(longitude) : ((_c = (_b = restaurant.location) === null || _b === void 0 ? void 0 : _b.coordinates) === null || _c === void 0 ? void 0 : _c.coordinates[0]) || 6.6959,
            latitude ? parseFloat(latitude) : ((_e = (_d = restaurant.location) === null || _d === void 0 ? void 0 : _d.coordinates) === null || _e === void 0 ? void 0 : _e.coordinates[1]) || 6.2059,
        ];
        restaurant.location = {
            address: address || ((_f = restaurant.location) === null || _f === void 0 ? void 0 : _f.address) || "",
            landmark: (_h = landmark !== null && landmark !== void 0 ? landmark : (_g = restaurant.location) === null || _g === void 0 ? void 0 : _g.landmark) !== null && _h !== void 0 ? _h : "",
            coordinates: {
                type: "Point",
                coordinates: coords,
            },
            delivery_radius_km: delivery_radius_km
                ? parseFloat(delivery_radius_km)
                : ((_j = restaurant.location) === null || _j === void 0 ? void 0 : _j.delivery_radius_km) || 5,
        };
        yield restaurant.save();
        return res.status(200).json({
            msg: "Restaurant location saved successfully",
            restaurant,
        });
    }
    catch (error) {
        console.error("save_restaurant_location error:", error);
        return res
            .status(500)
            .json({ msg: error.message || "Failed to save restaurant location" });
    }
});
exports.save_restaurant_location = save_restaurant_location;
// ─── Stage 3: Save & Verify Restaurant Bank Account ──────────────────────────
// POST /api/v1/restaurants/save-bank
const save_restaurant_bank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { bank_name, bank_code, account_number, account_name } = req.body;
        if (!account_number || account_number.length !== 10) {
            return res.status(400).json({ msg: "Account number must be 10 digits" });
        }
        if (!bank_code) {
            return res.status(400).json({ msg: "Bank code is required" });
        }
        let verified_account_name = account_name || "";
        // Verify account details via Paystack resolve API
        try {
            const resolved = yield (0, paystack_1.resolve_bank_account)(account_number, bank_code);
            if (resolved && resolved.account_name) {
                verified_account_name = resolved.account_name;
            }
        }
        catch (paystackError) {
            console.log("Paystack bank resolve notice:", ((_c = (_b = paystackError === null || paystackError === void 0 ? void 0 : paystackError.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || paystackError.message);
            // If Paystack API returns invalid account error, warn user
            if (((_d = paystackError === null || paystackError === void 0 ? void 0 : paystackError.response) === null || _d === void 0 ? void 0 : _d.status) === 422 || ((_f = (_e = paystackError === null || paystackError === void 0 ? void 0 : paystackError.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.status) === false) {
                return res.status(400).json({
                    msg: ((_h = (_g = paystackError === null || paystackError === void 0 ? void 0 : paystackError.response) === null || _g === void 0 ? void 0 : _g.data) === null || _h === void 0 ? void 0 : _h.message) || "Could not resolve bank account details. Please check the account number and bank selected.",
                });
            }
        }
        let restaurant = yield restaurant_1.default.findOne({ user: user_id });
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant profile not found. Please complete previous steps first." });
        }
        restaurant.bank = {
            bank_name: bank_name || ((_j = restaurant.bank) === null || _j === void 0 ? void 0 : _j.bank_name) || "",
            account_number: account_number || ((_k = restaurant.bank) === null || _k === void 0 ? void 0 : _k.account_number) || "",
            account_name: verified_account_name || ((_l = restaurant.bank) === null || _l === void 0 ? void 0 : _l.account_name) || "",
            bank_code: bank_code || ((_m = restaurant.bank) === null || _m === void 0 ? void 0 : _m.bank_code) || "",
        };
        yield restaurant.save();
        return res.status(200).json({
            msg: "Bank details verified and saved successfully",
            account_name: verified_account_name,
            restaurant,
        });
    }
    catch (error) {
        console.error("save_restaurant_bank error:", error);
        return res
            .status(500)
            .json({ msg: error.message || "Failed to save bank details" });
    }
});
exports.save_restaurant_bank = save_restaurant_bank;
// ─── Stage 4: Submit Verification & Application ────────────────────────────
// POST /api/v1/restaurants/save-verification
const submit_restaurant_verification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const files = req.files;
        let gov_id_url = "";
        let cac_doc_url = "";
        if ((_b = files === null || files === void 0 ? void 0 : files.government_id) === null || _b === void 0 ? void 0 : _b[0]) {
            gov_id_url = yield uploadToCloudinary(files.government_id[0].path, "restaurants/docs");
        }
        if ((_c = files === null || files === void 0 ? void 0 : files.cac_document) === null || _c === void 0 ? void 0 : _c[0]) {
            cac_doc_url = yield uploadToCloudinary(files.cac_document[0].path, "restaurants/docs");
        }
        let restaurant = yield restaurant_1.default.findOne({ user: user_id });
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant profile not found" });
        }
        if (gov_id_url)
            restaurant.verification.government_id = gov_id_url;
        if (cac_doc_url) {
            restaurant.verification.cac_document = cac_doc_url;
            restaurant.verification.is_cac_verified = true;
        }
        restaurant.application = "submitted";
        yield restaurant.save();
        yield user_1.default.findByIdAndUpdate(user_id, {
            restaurant_application: "submitted",
        });
        return res.status(200).json({
            msg: "Restaurant application submitted successfully",
            restaurant,
        });
    }
    catch (error) {
        console.error("submit_restaurant_verification error:", error);
        return res
            .status(500)
            .json({ msg: error.message || "Failed to submit application" });
    }
});
exports.submit_restaurant_verification = submit_restaurant_verification;
// ─── Full Fallback Registration Endpoint ──────────────────────────────────────
// POST /api/v1/restaurants/register
const register_restaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { name, phone, email, description, category_tags, operating_hours, address, landmark, latitude, longitude, delivery_radius_km, bank_name, account_number, account_name, bank_code, } = req.body;
        const files = req.files;
        let logo_url = "";
        let banner_url = "";
        let gov_id_url = "";
        let cac_doc_url = "";
        if ((_b = files === null || files === void 0 ? void 0 : files.logo) === null || _b === void 0 ? void 0 : _b[0]) {
            logo_url = yield uploadToCloudinary(files.logo[0].path, "restaurants/logos");
        }
        if ((_c = files === null || files === void 0 ? void 0 : files.banner) === null || _c === void 0 ? void 0 : _c[0]) {
            banner_url = yield uploadToCloudinary(files.banner[0].path, "restaurants/banners");
        }
        if ((_d = files === null || files === void 0 ? void 0 : files.government_id) === null || _d === void 0 ? void 0 : _d[0]) {
            gov_id_url = yield uploadToCloudinary(files.government_id[0].path, "restaurants/docs");
        }
        if ((_e = files === null || files === void 0 ? void 0 : files.cac_document) === null || _e === void 0 ? void 0 : _e[0]) {
            cac_doc_url = yield uploadToCloudinary(files.cac_document[0].path, "restaurants/docs");
        }
        let parsedHours = operating_hours;
        if (typeof operating_hours === "string") {
            try {
                parsedHours = JSON.parse(operating_hours);
            }
            catch (e) {
                parsedHours = [];
            }
        }
        let parsedTags = category_tags;
        if (typeof category_tags === "string") {
            try {
                parsedTags = JSON.parse(category_tags);
            }
            catch (e) {
                parsedTags = category_tags.split(",").map((t) => t.trim());
            }
        }
        const coords = [
            longitude ? parseFloat(longitude) : 6.6959,
            latitude ? parseFloat(latitude) : 6.2059,
        ];
        let restaurant = yield restaurant_1.default.findOne({ user: user_id });
        if (restaurant) {
            restaurant.name = name || restaurant.name;
            restaurant.phone = phone || restaurant.phone;
            restaurant.email = email || restaurant.email;
            restaurant.description = description !== null && description !== void 0 ? description : restaurant.description;
            if (parsedTags)
                restaurant.category_tags = parsedTags;
            if (parsedHours)
                restaurant.operating_hours = parsedHours;
            if (logo_url)
                restaurant.logo = logo_url;
            if (banner_url)
                restaurant.banner = banner_url;
            restaurant.location = {
                address: address || restaurant.location.address,
                landmark: landmark !== null && landmark !== void 0 ? landmark : restaurant.location.landmark,
                coordinates: {
                    type: "Point",
                    coordinates: coords,
                },
                delivery_radius_km: delivery_radius_km
                    ? parseFloat(delivery_radius_km)
                    : restaurant.location.delivery_radius_km,
            };
            if (bank_name || account_number) {
                restaurant.bank = {
                    bank_name: bank_name || ((_f = restaurant.bank) === null || _f === void 0 ? void 0 : _f.bank_name) || "",
                    account_number: account_number || ((_g = restaurant.bank) === null || _g === void 0 ? void 0 : _g.account_number) || "",
                    account_name: account_name || ((_h = restaurant.bank) === null || _h === void 0 ? void 0 : _h.account_name) || "",
                    bank_code: bank_code || ((_j = restaurant.bank) === null || _j === void 0 ? void 0 : _j.bank_code) || "",
                };
            }
            if (gov_id_url)
                restaurant.verification.government_id = gov_id_url;
            if (cac_doc_url) {
                restaurant.verification.cac_document = cac_doc_url;
                restaurant.verification.is_cac_verified = true;
            }
            restaurant.application = "submitted";
            yield restaurant.save();
        }
        else {
            restaurant = yield restaurant_1.default.create({
                user: user_id,
                name: name || "Restaurant",
                phone: phone || "",
                email: email || "",
                description: description || "",
                category_tags: parsedTags || [],
                operating_hours: parsedHours || [],
                logo: logo_url,
                banner: banner_url,
                location: {
                    address: address || "",
                    landmark: landmark || "",
                    coordinates: {
                        type: "Point",
                        coordinates: coords,
                    },
                    delivery_radius_km: delivery_radius_km ? parseFloat(delivery_radius_km) : 5,
                },
                bank: {
                    bank_name: bank_name || "",
                    account_number: account_number || "",
                    account_name: account_name || "",
                    bank_code: bank_code || "",
                },
                verification: {
                    government_id: gov_id_url,
                    cac_document: cac_doc_url,
                    is_cac_verified: !!cac_doc_url,
                },
                application: "submitted",
            });
        }
        yield user_1.default.findByIdAndUpdate(user_id, {
            restaurant_application: "submitted",
        });
        return res.status(200).json({
            msg: "Restaurant registration submitted successfully",
            restaurant,
        });
    }
    catch (error) {
        console.error("register_restaurant error:", error);
        return res
            .status(500)
            .json({ msg: error.message || "Failed to register restaurant" });
    }
});
exports.register_restaurant = register_restaurant;
// ─── Get Current Restaurant Profile ─────────────────────────────────────────
// GET /api/v1/restaurants/me
const get_restaurant_profile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const restaurant = yield restaurant_1.default.findOne({ user: user_id });
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant profile not found" });
        }
        return res.status(200).json({ restaurant });
    }
    catch (error) {
        return res.status(500).json({ msg: error.message || "Server error" });
    }
});
exports.get_restaurant_profile = get_restaurant_profile;
// ─── Toggle Online Status ───────────────────────────────────────────────────
// PATCH /api/v1/restaurants/online
const set_restaurant_online_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { is_online } = req.body;
        const restaurant = yield restaurant_1.default.findOneAndUpdate({ user: user_id }, { is_online: Boolean(is_online) }, { new: true });
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant not found" });
        }
        return res.status(200).json({
            msg: `Restaurant is now ${restaurant.is_online ? "online" : "offline"}`,
            is_online: restaurant.is_online,
            restaurant,
        });
    }
    catch (error) {
        return res.status(500).json({ msg: error.message || "Server error" });
    }
});
exports.set_restaurant_online_status = set_restaurant_online_status;
// ─── Get All Registered Restaurants (for Customers) ─────────────────────────
// GET /api/v1/restaurants/all
const get_all_restaurants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurants = yield restaurant_1.default.find({
            is_deleted: { $ne: true },
            is_blocked: { $ne: true },
            application: "approved",
        }).sort({ createdAt: -1 });
        return res.status(200).json({ restaurants });
    }
    catch (error) {
        console.error("get_all_restaurants error:", error);
        return res
            .status(500)
            .json({ msg: error.message || "Failed to fetch registered restaurants" });
    }
});
exports.get_all_restaurants = get_all_restaurants;
// ─── Get Single Restaurant Profile by ID (Public) ─────────────────────────
// GET /api/v1/restaurants/:id
const get_restaurant_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const restaurant = yield restaurant_1.default.findById(id);
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant profile not found" });
        }
        return res.status(200).json({ restaurant });
    }
    catch (error) {
        return res.status(500).json({ msg: error.message || "Server error" });
    }
});
exports.get_restaurant_by_id = get_restaurant_by_id;
