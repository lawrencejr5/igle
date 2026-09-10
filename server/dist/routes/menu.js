"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const menu_1 = require("../controllers/menu");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const MenuRouter = (0, express_1.Router)();
// ─── Public Endpoints ────────────────────────────────────────────────────────
// Get public menu categories for a restaurant
MenuRouter.get("/categories/restaurant/:restaurantId", menu_1.get_public_categories);
// Get public menu items for a restaurant (optional query: ?category_id=...)
MenuRouter.get("/items/restaurant/:restaurantId", menu_1.get_public_menu_items);
// Get details of a single menu item
MenuRouter.get("/items/details/:id", menu_1.get_menu_item_by_id);
// ─── Vendor Authenticated Endpoints ──────────────────────────────────────────
MenuRouter.use(auth_1.auth);
// Category Routes
MenuRouter.post("/categories", menu_1.create_category);
MenuRouter.get("/categories/vendor", menu_1.get_vendor_categories);
MenuRouter.put("/categories/:id", menu_1.update_category);
MenuRouter.delete("/categories/:id", menu_1.delete_category);
// Menu Item Routes
MenuRouter.post("/items", upload_1.upload.single("image"), menu_1.create_menu_item);
MenuRouter.get("/items/vendor", menu_1.get_vendor_menu_items);
MenuRouter.put("/items/:id", upload_1.upload.single("image"), menu_1.update_menu_item);
MenuRouter.patch("/items/:id/toggle-availability", menu_1.toggle_item_availability);
MenuRouter.delete("/items/:id", menu_1.delete_menu_item);
exports.default = MenuRouter;
