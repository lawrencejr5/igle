"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AdminRouter = express_1.default.Router();
const admin_1 = require("../controllers/admin");
const adminFood_1 = require("../controllers/adminFood");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
AdminRouter.post("/register", admin_1.register);
AdminRouter.post("/login", admin_1.login);
AdminRouter.get("/data", auth_1.auth, admin_1.get_admin_data);
AdminRouter.patch("/profile", auth_1.auth, admin_1.update_profile);
AdminRouter.patch("/password", auth_1.auth, admin_1.update_password);
AdminRouter.patch("/profile_pic", [auth_1.auth, upload_1.upload.single("profile_pic")], admin_1.upload_profile_pic);
AdminRouter.patch("/remove_pic", auth_1.auth, admin_1.remove_profile_pic);
AdminRouter.get("/summary", auth_1.auth, admin_1.summary);
// ─── Restaurant Admin Routes ─────────────────────────────────────────────────
AdminRouter.get("/restaurants", auth_1.auth, adminFood_1.admin_get_all_restaurants);
AdminRouter.get("/restaurants/:id", auth_1.auth, adminFood_1.admin_get_restaurant_by_id);
AdminRouter.get("/restaurants/:id/menu", auth_1.auth, adminFood_1.admin_get_restaurant_menu);
AdminRouter.patch("/restaurants/:id/approve", auth_1.auth, adminFood_1.admin_approve_restaurant);
AdminRouter.patch("/restaurants/:id/reject", auth_1.auth, adminFood_1.admin_reject_restaurant);
AdminRouter.patch("/restaurants/:id/block", auth_1.auth, adminFood_1.admin_block_restaurant);
AdminRouter.delete("/restaurants/:id", auth_1.auth, adminFood_1.admin_delete_restaurant);
// ─── Food Order Admin Routes ──────────────────────────────────────────────────
AdminRouter.get("/food-orders", auth_1.auth, adminFood_1.admin_get_all_food_orders);
AdminRouter.get("/food-orders/:id", auth_1.auth, adminFood_1.admin_get_food_order_by_id);
AdminRouter.patch("/food-orders/:id/status", auth_1.auth, adminFood_1.admin_update_food_order_status);
AdminRouter.patch("/food-orders/:id/cancel", auth_1.auth, adminFood_1.admin_cancel_food_order);
AdminRouter.delete("/food-orders/:id", auth_1.auth, adminFood_1.admin_delete_food_order);
// ─── Menu Admin Routes ────────────────────────────────────────────────────────
AdminRouter.patch("/menu-items/:id/toggle", auth_1.auth, adminFood_1.admin_toggle_menu_item);
AdminRouter.delete("/menu-items/:id", auth_1.auth, adminFood_1.admin_delete_menu_item);
exports.default = AdminRouter;
