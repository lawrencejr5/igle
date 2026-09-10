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
exports.delete_menu_item = exports.toggle_item_availability = exports.update_menu_item = exports.get_menu_item_by_id = exports.get_public_menu_items = exports.get_vendor_menu_items = exports.create_menu_item = exports.delete_category = exports.update_category = exports.get_public_categories = exports.get_vendor_categories = exports.create_category = void 0;
const menuCategory_1 = __importDefault(require("../models/menuCategory"));
const menuItem_1 = __importDefault(require("../models/menuItem"));
const upload_1 = require("../middleware/upload");
const get_vendor_restaurant_1 = require("../utils/get_vendor_restaurant");
// Helper for uploading image file to Cloudinary
const uploadToCloudinary = (filePath_1, ...args_1) => __awaiter(void 0, [filePath_1, ...args_1], void 0, function* (filePath, folder = "restaurants/menu_items") {
    var _a;
    try {
        const result = yield upload_1.cloudinary.uploader.upload(filePath, { folder });
        return result.secure_url;
    }
    catch (error) {
        console.error("Cloudinary upload failed:", error);
        if (error.code === "EAI_AGAIN" ||
            error.errno === -3001 ||
            ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("getaddrinfo"))) {
            throw new Error("Network connection error: Unable to reach Cloudinary image service (api.cloudinary.com). Please check your internet connection.");
        }
        throw error;
    }
});
// ─── MENU CATEGORY CONTROLLERS ────────────────────────────────────────────────
// 1. Create Menu Category (Vendor)
// POST /api/v1/menu/categories
const create_category = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { name, description, display_order } = req.body;
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ msg: "Category name is required" });
        }
        const trimmedName = name.trim();
        // Check for duplicate category name within the same restaurant
        const existingCategory = yield menuCategory_1.default.findOne({
            restaurant: restaurant._id,
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
        });
        if (existingCategory) {
            return res.status(400).json({
                msg: "A category with this name already exists in your restaurant menu.",
            });
        }
        const category = new menuCategory_1.default({
            restaurant: restaurant._id,
            name: trimmedName,
            description: description || "",
            display_order: display_order !== undefined ? Number(display_order) : 0,
            is_active: true,
        });
        yield category.save();
        return res.status(201).json({
            msg: "Menu category created successfully",
            category,
        });
    }
    catch (error) {
        console.error("create_category error:", error);
        return res
            .status(500)
            .json({ msg: "Server error creating menu category", error: error.message });
    }
});
exports.create_category = create_category;
// 2. Get Vendor Categories (Vendor)
// GET /api/v1/menu/categories/vendor
const get_vendor_categories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const categories = yield menuCategory_1.default.find({
            restaurant: restaurant._id,
        }).sort({ display_order: 1, createdAt: 1 });
        return res.status(200).json({ categories });
    }
    catch (error) {
        console.error("get_vendor_categories error:", error);
        return res
            .status(500)
            .json({ msg: "Server error fetching categories", error: error.message });
    }
});
exports.get_vendor_categories = get_vendor_categories;
// 3. Get Public Categories for a Restaurant (Public / Customer)
// GET /api/v1/menu/categories/restaurant/:restaurantId
const get_public_categories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restaurantId } = req.params;
        const categories = yield menuCategory_1.default.find({
            restaurant: restaurantId,
            is_active: true,
        }).sort({ display_order: 1, createdAt: 1 });
        return res.status(200).json({ categories });
    }
    catch (error) {
        console.error("get_public_categories error:", error);
        return res
            .status(500)
            .json({ msg: "Server error fetching public categories", error: error.message });
    }
});
exports.get_public_categories = get_public_categories;
// 4. Update Category (Vendor)
// PUT /api/v1/menu/categories/:id
const update_category = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const { name, description, display_order, is_active } = req.body;
        const category = yield menuCategory_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
        });
        if (!category) {
            return res
                .status(404)
                .json({ msg: "Menu category not found or does not belong to your restaurant" });
        }
        if (name && typeof name === "string" && name.trim()) {
            const trimmedName = name.trim();
            if (trimmedName.toLowerCase() !== category.name.toLowerCase()) {
                const duplicate = yield menuCategory_1.default.findOne({
                    restaurant: restaurant._id,
                    _id: { $ne: category._id },
                    name: { $regex: new RegExp(`^${trimmedName}$`, "i") },
                });
                if (duplicate) {
                    return res.status(400).json({
                        msg: "Another category with this name already exists in your restaurant menu.",
                    });
                }
                category.name = trimmedName;
            }
        }
        if (description !== undefined)
            category.description = description;
        if (display_order !== undefined)
            category.display_order = Number(display_order);
        if (is_active !== undefined)
            category.is_active = Boolean(is_active);
        yield category.save();
        return res.status(200).json({
            msg: "Menu category updated successfully",
            category,
        });
    }
    catch (error) {
        console.error("update_category error:", error);
        return res
            .status(500)
            .json({ msg: "Server error updating category", error: error.message });
    }
});
exports.update_category = update_category;
// 5. Delete Category (Vendor)
// DELETE /api/v1/menu/categories/:id
const delete_category = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const category = yield menuCategory_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
        });
        if (!category) {
            return res
                .status(404)
                .json({ msg: "Menu category not found or does not belong to your restaurant" });
        }
        // CHECK: Are there active/non-deleted menu items under this category?
        const existingItemsCount = yield menuItem_1.default.countDocuments({
            category: category._id,
            is_deleted: { $ne: true },
        });
        if (existingItemsCount > 0) {
            return res.status(400).json({
                msg: `Cannot delete menu category "${category.name}". It contains ${existingItemsCount} active menu item(s). Please delete or reassign these items first.`,
                item_count: existingItemsCount,
            });
        }
        yield menuCategory_1.default.findByIdAndDelete(category._id);
        return res.status(200).json({
            msg: "Menu category deleted successfully",
            category_id: id,
        });
    }
    catch (error) {
        console.error("delete_category error:", error);
        return res
            .status(500)
            .json({ msg: "Server error deleting category", error: error.message });
    }
});
exports.delete_category = delete_category;
// ─── MENU ITEM CONTROLLERS ───────────────────────────────────────────────────
// 1. Create Menu Item (Vendor)
// POST /api/v1/menu/items
const create_menu_item = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { category_id, name, description, price, preparation_time_mins, options_groups, dietary_flags, is_available, display_order, } = req.body;
        if (!category_id) {
            return res.status(400).json({ msg: "category_id is required" });
        }
        if (!name || typeof name !== "string" || !name.trim()) {
            return res.status(400).json({ msg: "Menu item name is required" });
        }
        if (price === undefined || price === null || isNaN(Number(price))) {
            return res.status(400).json({ msg: "Valid menu item price is required" });
        }
        // Verify category belongs to this vendor
        const category = yield menuCategory_1.default.findOne({
            _id: category_id,
            restaurant: restaurant._id,
        });
        if (!category) {
            return res.status(400).json({
                msg: "Selected menu category was not found or does not belong to your restaurant.",
            });
        }
        // Handle optional food item image upload
        let image_url = "";
        if (req.file) {
            image_url = yield uploadToCloudinary(req.file.path, "restaurants/menu_items");
        }
        // Parse options_groups if sent as string (multipart/form-data)
        let parsedOptionsGroups = options_groups;
        if (typeof options_groups === "string") {
            try {
                parsedOptionsGroups = JSON.parse(options_groups);
            }
            catch (e) {
                parsedOptionsGroups = [];
            }
        }
        // Parse dietary_flags if sent as string
        let parsedDietaryFlags = dietary_flags;
        if (typeof dietary_flags === "string") {
            try {
                parsedDietaryFlags = JSON.parse(dietary_flags);
            }
            catch (e) {
                parsedDietaryFlags = dietary_flags.split(",").map((f) => f.trim());
            }
        }
        const menuItem = new menuItem_1.default({
            restaurant: restaurant._id,
            category: category._id,
            name: name.trim(),
            description: description || "",
            price: Number(price),
            image: image_url,
            preparation_time_mins: preparation_time_mins ? Number(preparation_time_mins) : 20,
            options_groups: Array.isArray(parsedOptionsGroups) ? parsedOptionsGroups : [],
            dietary_flags: Array.isArray(parsedDietaryFlags) ? parsedDietaryFlags : [],
            is_available: is_available !== undefined ? Boolean(is_available) : true,
            display_order: display_order ? Number(display_order) : 0,
        });
        yield menuItem.save();
        return res.status(201).json({
            msg: "Menu item created successfully",
            item: menuItem,
        });
    }
    catch (error) {
        console.error("create_menu_item error:", error);
        return res
            .status(500)
            .json({ msg: "Server error creating menu item", error: error.message });
    }
});
exports.create_menu_item = create_menu_item;
// 2. Get Vendor Menu Items (Vendor)
// GET /api/v1/menu/items/vendor
const get_vendor_menu_items = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const items = yield menuItem_1.default.find({
            restaurant: restaurant._id,
            is_deleted: { $ne: true },
        })
            .populate("category", "name display_order is_active")
            .sort({ display_order: 1, createdAt: -1 });
        return res.status(200).json({ items });
    }
    catch (error) {
        console.error("get_vendor_menu_items error:", error);
        return res
            .status(500)
            .json({ msg: "Server error fetching vendor menu items", error: error.message });
    }
});
exports.get_vendor_menu_items = get_vendor_menu_items;
// 3. Get Public Menu Items for a Restaurant (Public / Customer)
// GET /api/v1/menu/items/restaurant/:restaurantId
const get_public_menu_items = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { restaurantId } = req.params;
        const { category_id } = req.query;
        const queryFilter = {
            restaurant: restaurantId,
            is_available: true,
            is_deleted: { $ne: true },
        };
        if (category_id) {
            queryFilter.category = category_id;
        }
        const items = yield menuItem_1.default.find(queryFilter)
            .populate("category", "name display_order")
            .sort({ display_order: 1, createdAt: -1 });
        return res.status(200).json({ items });
    }
    catch (error) {
        console.error("get_public_menu_items error:", error);
        return res
            .status(500)
            .json({ msg: "Server error fetching menu items", error: error.message });
    }
});
exports.get_public_menu_items = get_public_menu_items;
// 4. Get Single Menu Item Details
// GET /api/v1/menu/items/:id
const get_menu_item_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const item = yield menuItem_1.default.findOne({
            _id: id,
            is_deleted: { $ne: true },
        })
            .populate("category", "name description")
            .populate("restaurant", "name logo banner is_online location rating");
        if (!item) {
            return res.status(404).json({ msg: "Menu item not found" });
        }
        return res.status(200).json({ item });
    }
    catch (error) {
        console.error("get_menu_item_by_id error:", error);
        return res
            .status(500)
            .json({ msg: "Server error fetching menu item details", error: error.message });
    }
});
exports.get_menu_item_by_id = get_menu_item_by_id;
// 5. Update Menu Item (Vendor)
// PUT /api/v1/menu/items/:id
const update_menu_item = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const { category_id, name, description, price, preparation_time_mins, options_groups, dietary_flags, is_available, display_order, } = req.body;
        const menuItem = yield menuItem_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
            is_deleted: { $ne: true },
        });
        if (!menuItem) {
            return res
                .status(404)
                .json({ msg: "Menu item not found or does not belong to your restaurant" });
        }
        if (category_id) {
            const category = yield menuCategory_1.default.findOne({
                _id: category_id,
                restaurant: restaurant._id,
            });
            if (!category) {
                return res.status(400).json({
                    msg: "Selected menu category was not found or does not belong to your restaurant.",
                });
            }
            menuItem.category = category._id;
        }
        if (name && typeof name === "string")
            menuItem.name = name.trim();
        if (description !== undefined)
            menuItem.description = description;
        if (price !== undefined && !isNaN(Number(price)))
            menuItem.price = Number(price);
        if (preparation_time_mins !== undefined)
            menuItem.preparation_time_mins = Number(preparation_time_mins);
        if (req.file) {
            menuItem.image = yield uploadToCloudinary(req.file.path, "restaurants/menu_items");
        }
        if (options_groups !== undefined) {
            let parsedOptionsGroups = options_groups;
            if (typeof options_groups === "string") {
                try {
                    parsedOptionsGroups = JSON.parse(options_groups);
                }
                catch (e) {
                    parsedOptionsGroups = menuItem.options_groups;
                }
            }
            if (Array.isArray(parsedOptionsGroups)) {
                menuItem.options_groups = parsedOptionsGroups;
            }
        }
        if (dietary_flags !== undefined) {
            let parsedDietaryFlags = dietary_flags;
            if (typeof dietary_flags === "string") {
                try {
                    parsedDietaryFlags = JSON.parse(dietary_flags);
                }
                catch (e) {
                    parsedDietaryFlags = dietary_flags.split(",").map((f) => f.trim());
                }
            }
            if (Array.isArray(parsedDietaryFlags)) {
                menuItem.dietary_flags = parsedDietaryFlags;
            }
        }
        if (is_available !== undefined)
            menuItem.is_available = Boolean(is_available);
        if (display_order !== undefined)
            menuItem.display_order = Number(display_order);
        yield menuItem.save();
        return res.status(200).json({
            msg: "Menu item updated successfully",
            item: menuItem,
        });
    }
    catch (error) {
        console.error("update_menu_item error:", error);
        return res
            .status(500)
            .json({ msg: "Server error updating menu item", error: error.message });
    }
});
exports.update_menu_item = update_menu_item;
// 6. Toggle Item Availability (Vendor)
// PATCH /api/v1/menu/items/:id/toggle-availability
const toggle_item_availability = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const menuItem = yield menuItem_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
            is_deleted: { $ne: true },
        });
        if (!menuItem) {
            return res
                .status(404)
                .json({ msg: "Menu item not found or does not belong to your restaurant" });
        }
        menuItem.is_available = !menuItem.is_available;
        yield menuItem.save();
        return res.status(200).json({
            msg: `Menu item availability set to ${menuItem.is_available ? "Available" : "Out of Stock"}`,
            is_available: menuItem.is_available,
            item: menuItem,
        });
    }
    catch (error) {
        console.error("toggle_item_availability error:", error);
        return res
            .status(500)
            .json({ msg: "Server error toggling availability", error: error.message });
    }
});
exports.toggle_item_availability = toggle_item_availability;
// 7. Soft Delete Menu Item (Vendor)
// DELETE /api/v1/menu/items/:id
const delete_menu_item = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const menuItem = yield menuItem_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
            is_deleted: { $ne: true },
        });
        if (!menuItem) {
            return res
                .status(404)
                .json({ msg: "Menu item not found or does not belong to your restaurant" });
        }
        menuItem.is_deleted = true;
        menuItem.deleted_at = new Date();
        menuItem.is_available = false;
        yield menuItem.save();
        return res.status(200).json({
            msg: "Menu item deleted successfully",
            item_id: id,
        });
    }
    catch (error) {
        console.error("delete_menu_item error:", error);
        return res
            .status(500)
            .json({ msg: "Server error deleting menu item", error: error.message });
    }
});
exports.delete_menu_item = delete_menu_item;
