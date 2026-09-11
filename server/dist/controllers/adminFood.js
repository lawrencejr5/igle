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
exports.admin_delete_menu_item = exports.admin_toggle_menu_item = exports.admin_get_restaurant_menu = exports.admin_delete_food_order = exports.admin_cancel_food_order = exports.admin_update_food_order_status = exports.admin_get_food_order_by_id = exports.admin_get_all_food_orders = exports.admin_delete_restaurant = exports.admin_block_restaurant = exports.admin_reject_restaurant = exports.admin_approve_restaurant = exports.admin_get_restaurant_by_id = exports.admin_get_all_restaurants = void 0;
const restaurant_1 = __importDefault(require("../models/restaurant"));
const foodOrder_1 = __importDefault(require("../models/foodOrder"));
const menuItem_1 = __importDefault(require("../models/menuItem"));
const menuCategory_1 = __importDefault(require("../models/menuCategory"));
const user_1 = __importDefault(require("../models/user"));
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const get_vendor_wallet_1 = require("../utils/get_vendor_wallet");
// ─── RESTAURANT ADMIN ────────────────────────────────────────────────────────
// GET /admin/restaurants
const admin_get_all_restaurants = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, status, search, dateFrom, dateTo, } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, parseInt(limit, 10));
        const skip = (pageNum - 1) * limitNum;
        const filter = { is_deleted: { $ne: true } };
        if (status && status !== "all") {
            filter.application = status;
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { phone: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom)
                filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }
        const [restaurants, total] = yield Promise.all([
            restaurant_1.default.find(filter)
                .populate("user", "name email phone profile_pic restaurant_application")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            restaurant_1.default.countDocuments(filter),
        ]);
        return res.status(200).json({
            restaurants,
            rowCount: total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
        });
    }
    catch (error) {
        console.error("admin_get_all_restaurants error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_get_all_restaurants = admin_get_all_restaurants;
// GET /admin/restaurants/:id
const admin_get_restaurant_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const restaurant = yield restaurant_1.default.findById(id).populate("user", "name email phone profile_pic restaurant_application is_blocked");
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant not found" });
        }
        return res.status(200).json({ restaurant });
    }
    catch (error) {
        console.error("admin_get_restaurant_by_id error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_get_restaurant_by_id = admin_get_restaurant_by_id;
// PATCH /admin/restaurants/:id/approve
const admin_approve_restaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const restaurant = yield restaurant_1.default.findById(id);
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant not found" });
        }
        restaurant.application = "approved";
        restaurant.is_verified = true;
        yield restaurant.save();
        yield user_1.default.findByIdAndUpdate(restaurant.user, {
            restaurant_application: "approved",
            is_restaurant: true,
        });
        // Ensure specialized Restaurant Wallet exists for this restaurant
        const existingVendorWallet = yield wallet_1.default.findOne({
            owner_id: restaurant._id,
            owner_type: "Restaurant",
        });
        if (!existingVendorWallet) {
            yield wallet_1.default.create({
                owner_id: restaurant._id,
                owner_type: "Restaurant",
                balance: 0,
            });
        }
        return res.status(200).json({
            msg: "Restaurant approved successfully",
            restaurant,
        });
    }
    catch (error) {
        console.error("admin_approve_restaurant error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_approve_restaurant = admin_approve_restaurant;
// PATCH /admin/restaurants/:id/reject
const admin_reject_restaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const restaurant = yield restaurant_1.default.findById(id);
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant not found" });
        }
        restaurant.application = "rejected";
        yield restaurant.save();
        yield user_1.default.findByIdAndUpdate(restaurant.user, {
            restaurant_application: "rejected",
        });
        return res.status(200).json({
            msg: "Restaurant application rejected",
            reason: reason || "No reason provided",
            restaurant,
        });
    }
    catch (error) {
        console.error("admin_reject_restaurant error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_reject_restaurant = admin_reject_restaurant;
// PATCH /admin/restaurants/:id/block
const admin_block_restaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const adminId = (_a = req.admin) === null || _a === void 0 ? void 0 : _a.id;
        const restaurant = yield restaurant_1.default.findById(id);
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant not found" });
        }
        const newBlockedState = !restaurant.is_blocked;
        restaurant.is_blocked = newBlockedState;
        restaurant.blocked_at = newBlockedState ? new Date() : undefined;
        restaurant.blocked_by = newBlockedState ? adminId : undefined;
        yield restaurant.save();
        return res.status(200).json({
            msg: `Restaurant ${newBlockedState ? "blocked" : "unblocked"} successfully`,
            is_blocked: newBlockedState,
            restaurant,
        });
    }
    catch (error) {
        console.error("admin_block_restaurant error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_block_restaurant = admin_block_restaurant;
// DELETE /admin/restaurants/:id
const admin_delete_restaurant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const adminId = (_a = req.admin) === null || _a === void 0 ? void 0 : _a.id;
        const restaurant = yield restaurant_1.default.findById(id);
        if (!restaurant) {
            return res.status(404).json({ msg: "Restaurant not found" });
        }
        restaurant.is_deleted = true;
        restaurant.deleted_at = new Date();
        restaurant.deleted_by = adminId;
        yield restaurant.save();
        return res.status(200).json({
            msg: "Restaurant deleted successfully",
            restaurant_id: id,
        });
    }
    catch (error) {
        console.error("admin_delete_restaurant error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_delete_restaurant = admin_delete_restaurant;
// ─── FOOD ORDER ADMIN ─────────────────────────────────────────────────────────
// GET /admin/food-orders
const admin_get_all_food_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 10, status, search, dateFrom, dateTo, } = req.query;
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, parseInt(limit, 10));
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
        if (status && status !== "all") {
            filter.status = status;
        }
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom)
                filter.createdAt.$gte = new Date(dateFrom);
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }
        // Build base query; handle search separately via $or after populate isn't possible
        // so we filter by order_number directly in DB
        if (search) {
            filter.$or = [
                { order_number: { $regex: search, $options: "i" } },
            ];
        }
        const [orders, total] = yield Promise.all([
            foodOrder_1.default.find(filter)
                .populate("customer", "name phone profile_pic")
                .populate("restaurant", "name logo phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            foodOrder_1.default.countDocuments(filter),
        ]);
        return res.status(200).json({
            orders,
            rowCount: total,
            totalPages: Math.ceil(total / limitNum),
            currentPage: pageNum,
        });
    }
    catch (error) {
        console.error("admin_get_all_food_orders error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_get_all_food_orders = admin_get_all_food_orders;
// GET /admin/food-orders/:id
const admin_get_food_order_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const order = yield foodOrder_1.default.findById(id)
            .populate("customer", "name phone profile_pic email")
            .populate("restaurant", "name logo phone location category_tags");
        if (!order) {
            return res.status(404).json({ msg: "Food order not found" });
        }
        return res.status(200).json({ order });
    }
    catch (error) {
        console.error("admin_get_food_order_by_id error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_get_food_order_by_id = admin_get_food_order_by_id;
// PATCH /admin/food-orders/:id/status
const admin_update_food_order_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const validStatuses = [
            "placed",
            "preparing",
            "ready_for_pickup",
            "in_transit",
            "delivered",
            "cancelled",
            "rejected",
        ];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                msg: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
            });
        }
        const order = yield foodOrder_1.default.findById(id);
        if (!order) {
            return res.status(404).json({ msg: "Food order not found" });
        }
        order.status = status;
        // Set the relevant timestamp for the new status
        const now = new Date();
        if (status === "preparing")
            order.status_timestamps.preparing_at = now;
        else if (status === "ready_for_pickup")
            order.status_timestamps.ready_at = now;
        else if (status === "in_transit")
            order.status_timestamps.in_transit_at = now;
        else if (status === "delivered") {
            order.status_timestamps.delivered_at = now;
            yield (0, get_vendor_wallet_1.settleVendorOrderEarnings)(order);
        }
        else if (status === "cancelled" || status === "rejected") {
            order.status_timestamps.cancelled_at = now;
            yield (0, get_vendor_wallet_1.cancelVendorOrderPendingEarnings)(order);
        }
        yield order.save();
        return res.status(200).json({
            msg: `Food order status updated to "${status}"`,
            order,
        });
    }
    catch (error) {
        console.error("admin_update_food_order_status error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_update_food_order_status = admin_update_food_order_status;
// PATCH /admin/food-orders/:id/cancel
const admin_cancel_food_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const order = yield foodOrder_1.default.findById(id);
        if (!order) {
            return res.status(404).json({ msg: "Food order not found" });
        }
        const nonCancellableStatuses = ["delivered", "cancelled", "rejected"];
        if (nonCancellableStatuses.includes(order.status)) {
            return res.status(400).json({
                msg: `Order cannot be cancelled. Current status: ${order.status}`,
            });
        }
        order.status = "cancelled";
        order.cancellation = {
            cancelled_by: "admin",
            reason: reason || "Cancelled by admin",
        };
        order.status_timestamps.cancelled_at = new Date();
        yield order.save();
        // Cancel pending vendor earnings if order was accepted
        yield (0, get_vendor_wallet_1.cancelVendorOrderPendingEarnings)(order);
        // Refund customer wallet
        const customerWallet = yield wallet_1.default.findOne({ owner_id: order.customer });
        if (customerWallet) {
            customerWallet.balance += order.pricing.total;
            yield customerWallet.save();
            yield transaction_1.default.create({
                wallet_id: customerWallet._id,
                type: "payout",
                amount: order.pricing.total,
                status: "success",
                channel: "wallet",
                reference: (0, gen_unique_ref_1.generate_unique_reference)(),
                food_order_id: order._id,
                metadata: {
                    order_id: order._id,
                    order_number: order.order_number,
                    reason: "Admin order cancellation refund",
                },
            });
        }
        return res.status(200).json({
            msg: "Food order cancelled and customer refunded",
            order,
        });
    }
    catch (error) {
        console.error("admin_cancel_food_order error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_cancel_food_order = admin_cancel_food_order;
// DELETE /admin/food-orders/:id
const admin_delete_food_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const order = yield foodOrder_1.default.findByIdAndDelete(id);
        if (!order) {
            return res.status(404).json({ msg: "Food order not found" });
        }
        return res.status(200).json({
            msg: "Food order deleted successfully",
            order_id: id,
        });
    }
    catch (error) {
        console.error("admin_delete_food_order error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_delete_food_order = admin_delete_food_order;
// ─── MENU ADMIN ───────────────────────────────────────────────────────────────
// GET /admin/restaurants/:id/menu
const admin_get_restaurant_menu = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const [categories, items] = yield Promise.all([
            menuCategory_1.default.find({ restaurant: id }).sort({ display_order: 1, createdAt: 1 }),
            menuItem_1.default.find({ restaurant: id, is_deleted: { $ne: true } })
                .populate("category", "name display_order")
                .sort({ display_order: 1, createdAt: -1 }),
        ]);
        return res.status(200).json({ categories, items });
    }
    catch (error) {
        console.error("admin_get_restaurant_menu error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_get_restaurant_menu = admin_get_restaurant_menu;
// PATCH /admin/menu-items/:id/toggle
const admin_toggle_menu_item = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const menuItem = yield menuItem_1.default.findOne({ _id: id, is_deleted: { $ne: true } });
        if (!menuItem) {
            return res.status(404).json({ msg: "Menu item not found" });
        }
        menuItem.is_available = !menuItem.is_available;
        yield menuItem.save();
        return res.status(200).json({
            msg: `Menu item is now ${menuItem.is_available ? "Available" : "Unavailable"}`,
            is_available: menuItem.is_available,
            item: menuItem,
        });
    }
    catch (error) {
        console.error("admin_toggle_menu_item error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_toggle_menu_item = admin_toggle_menu_item;
// DELETE /admin/menu-items/:id
const admin_delete_menu_item = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const menuItem = yield menuItem_1.default.findOne({ _id: id, is_deleted: { $ne: true } });
        if (!menuItem) {
            return res.status(404).json({ msg: "Menu item not found" });
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
        console.error("admin_delete_menu_item error:", error);
        return res.status(500).json({ msg: "Server error", error: error.message });
    }
});
exports.admin_delete_menu_item = admin_delete_menu_item;
