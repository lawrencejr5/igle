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
exports.clear_basket = exports.remove_item_from_basket = exports.update_basket_item_quantity = exports.add_item_to_basket = exports.get_user_basket = void 0;
const basket_1 = __importDefault(require("../models/basket"));
const menuItem_1 = __importDefault(require("../models/menuItem"));
const restaurant_1 = __importDefault(require("../models/restaurant"));
// 1. Get User Basket(s)
// GET /api/v1/basket
// Optional query: ?restaurant_id=xxx
const get_user_basket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { restaurant_id } = req.query;
        if (restaurant_id) {
            const basket = yield basket_1.default.findOne({
                user: user_id,
                restaurant: restaurant_id,
            })
                .populate("restaurant", "name logo banner location is_online category_tags rating")
                .populate({
                path: "items.menu_item",
                select: "name price image is_available preparation_time_mins",
            });
            return res.status(200).json({ basket: basket || null });
        }
        // Return all active restaurant baskets for the customer
        const baskets = yield basket_1.default.find({ user: user_id })
            .populate("restaurant", "name logo banner location is_online category_tags rating")
            .populate({
            path: "items.menu_item",
            select: "name price image is_available preparation_time_mins",
        })
            .sort({ updatedAt: -1 });
        return res.status(200).json({ baskets });
    }
    catch (error) {
        console.error("get_user_basket error:", error);
        return res
            .status(500)
            .json({ msg: "Server error fetching baskets", error: error.message });
    }
});
exports.get_user_basket = get_user_basket;
// 2. Add Item to Basket (Stores item in specific restaurant basket)
// POST /api/v1/basket/add
const add_item_to_basket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { menu_item_id, quantity, selected_options, special_instructions } = req.body;
        if (!menu_item_id) {
            return res.status(400).json({ msg: "menu_item_id is required" });
        }
        const qty = quantity && Number(quantity) > 0 ? Number(quantity) : 1;
        // Fetch menu item
        const menuItem = yield menuItem_1.default.findOne({
            _id: menu_item_id,
            is_deleted: { $ne: true },
        });
        if (!menuItem) {
            return res.status(404).json({ msg: "Menu item not found" });
        }
        if (!menuItem.is_available) {
            return res
                .status(400)
                .json({ msg: `"${menuItem.name}" is currently out of stock` });
        }
        // Verify restaurant is active
        const restaurant = yield restaurant_1.default.findOne({
            _id: menuItem.restaurant,
            is_deleted: { $ne: true },
        });
        if (!restaurant) {
            return res.status(404).json({ msg: "Associated restaurant not found" });
        }
        // Find or create basket specifically for THIS user and THIS restaurant
        let basket = yield basket_1.default.findOne({
            user: user_id,
            restaurant: menuItem.restaurant,
        });
        // Calculate options price modifiers
        const parsedOptions = Array.isArray(selected_options)
            ? selected_options
            : [];
        let optionsExtraPrice = 0;
        parsedOptions.forEach((opt) => {
            if (opt.price_modifier && !isNaN(Number(opt.price_modifier))) {
                optionsExtraPrice += Number(opt.price_modifier);
            }
        });
        const unitPrice = menuItem.price;
        const itemTotal = (unitPrice + optionsExtraPrice) * qty;
        const menuItemId = menuItem._id;
        if (!basket) {
            basket = new basket_1.default({
                user: user_id,
                restaurant: menuItem.restaurant,
                items: [
                    {
                        menu_item: menuItemId,
                        quantity: qty,
                        unit_price: unitPrice,
                        selected_options: parsedOptions,
                        special_instructions: special_instructions || "",
                        item_total: itemTotal,
                    },
                ],
                subtotal: itemTotal,
            });
        }
        else {
            // Helper to check if item options match
            const optionsMatch = (opts1, opts2) => {
                if (opts1.length !== opts2.length)
                    return false;
                const s1 = opts1
                    .map((o) => `${o.group_name}:${o.option_name}`)
                    .sort()
                    .join("|");
                const s2 = opts2
                    .map((o) => `${o.group_name}:${o.option_name}`)
                    .sort()
                    .join("|");
                return s1 === s2;
            };
            const existingIndex = basket.items.findIndex((item) => item.menu_item.toString() === menuItemId.toString() &&
                optionsMatch(item.selected_options || [], parsedOptions));
            if (existingIndex > -1) {
                // Increment quantity
                const updatedQty = basket.items[existingIndex].quantity + qty;
                basket.items[existingIndex].quantity = updatedQty;
                basket.items[existingIndex].item_total =
                    (unitPrice + optionsExtraPrice) * updatedQty;
                if (special_instructions) {
                    basket.items[existingIndex].special_instructions =
                        special_instructions;
                }
            }
            else {
                // Push new item entry
                basket.items.push({
                    menu_item: menuItemId,
                    quantity: qty,
                    unit_price: unitPrice,
                    selected_options: parsedOptions,
                    special_instructions: special_instructions || "",
                    item_total: itemTotal,
                });
            }
            // Recalculate basket subtotal
            basket.subtotal = basket.items.reduce((sum, item) => sum + (item.item_total || 0), 0);
        }
        yield basket.save();
        yield basket.populate([
            { path: "restaurant", select: "name logo location is_online" },
            { path: "items.menu_item", select: "name price image is_available" },
        ]);
        return res.status(200).json({
            msg: `Item added to ${restaurant.name} basket`,
            basket,
        });
    }
    catch (error) {
        console.error("add_item_to_basket error:", error);
        return res
            .status(500)
            .json({ msg: "Server error adding item to basket", error: error.message });
    }
});
exports.add_item_to_basket = add_item_to_basket;
// 3. Update Basket Item Quantity
// PATCH /api/v1/basket/items/:itemId
const update_basket_item_quantity = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { itemId } = req.params;
        const { quantity } = req.body;
        if (quantity === undefined || isNaN(Number(quantity))) {
            return res.status(400).json({ msg: "Valid quantity is required" });
        }
        const newQty = Number(quantity);
        // Find basket containing this itemId for the user
        const basket = yield basket_1.default.findOne({
            user: user_id,
            "items._id": itemId,
        });
        if (!basket) {
            return res.status(404).json({ msg: "Item not found in any active basket" });
        }
        const itemIndex = basket.items.findIndex((item) => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) === itemId; });
        if (itemIndex === -1) {
            return res.status(404).json({ msg: "Item not found in basket" });
        }
        if (newQty <= 0) {
            basket.items.splice(itemIndex, 1);
        }
        else {
            const item = basket.items[itemIndex];
            let optionsExtra = 0;
            (item.selected_options || []).forEach((opt) => {
                optionsExtra += opt.price_modifier || 0;
            });
            item.quantity = newQty;
            item.item_total = (item.unit_price + optionsExtra) * newQty;
        }
        // If basket items empty after removal, delete basket
        if (basket.items.length === 0) {
            yield basket_1.default.findByIdAndDelete(basket._id);
            return res.status(200).json({
                msg: "Basket item removed and empty basket cleared",
                basket: null,
            });
        }
        // Recalculate subtotal
        basket.subtotal = basket.items.reduce((sum, item) => sum + (item.item_total || 0), 0);
        yield basket.save();
        yield basket.populate([
            { path: "restaurant", select: "name logo location is_online" },
            { path: "items.menu_item", select: "name price image is_available" },
        ]);
        return res.status(200).json({
            msg: "Basket item updated",
            basket,
        });
    }
    catch (error) {
        console.error("update_basket_item_quantity error:", error);
        return res
            .status(500)
            .json({ msg: "Server error updating basket item", error: error.message });
    }
});
exports.update_basket_item_quantity = update_basket_item_quantity;
// 4. Remove Item from Basket
// DELETE /api/v1/basket/items/:itemId
const remove_item_from_basket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { itemId } = req.params;
        const basket = yield basket_1.default.findOne({
            user: user_id,
            "items._id": itemId,
        });
        if (!basket) {
            return res.status(404).json({ msg: "Item not found in any active basket" });
        }
        basket.items = basket.items.filter((item) => { var _a; return ((_a = item._id) === null || _a === void 0 ? void 0 : _a.toString()) !== itemId; });
        if (basket.items.length === 0) {
            yield basket_1.default.findByIdAndDelete(basket._id);
            return res.status(200).json({
                msg: "Item removed and empty basket cleared",
                basket: null,
            });
        }
        basket.subtotal = basket.items.reduce((sum, item) => sum + (item.item_total || 0), 0);
        yield basket.save();
        yield basket.populate([
            { path: "restaurant", select: "name logo location is_online" },
            { path: "items.menu_item", select: "name price image is_available" },
        ]);
        return res.status(200).json({
            msg: "Item removed from basket",
            basket,
        });
    }
    catch (error) {
        console.error("remove_item_from_basket error:", error);
        return res
            .status(500)
            .json({ msg: "Server error removing basket item", error: error.message });
    }
});
exports.remove_item_from_basket = remove_item_from_basket;
// 5. Clear Basket (Clears specific restaurant basket or all)
// DELETE /api/v1/basket
// Optional query: ?restaurant_id=xxx
const clear_basket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { restaurant_id } = req.query;
        if (restaurant_id) {
            yield basket_1.default.findOneAndDelete({
                user: user_id,
                restaurant: restaurant_id,
            });
        }
        else {
            yield basket_1.default.deleteMany({ user: user_id });
        }
        return res.status(200).json({
            msg: restaurant_id
                ? "Restaurant basket cleared successfully"
                : "All user baskets cleared successfully",
            basket: null,
        });
    }
    catch (error) {
        console.error("clear_basket error:", error);
        return res
            .status(500)
            .json({ msg: "Server error clearing basket", error: error.message });
    }
});
exports.clear_basket = clear_basket;
