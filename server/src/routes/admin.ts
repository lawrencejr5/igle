import express from "express";
const AdminRouter = express.Router();

import {
  register,
  login,
  get_admin_data,
  update_profile,
  update_password,
  upload_profile_pic,
  remove_profile_pic,
  summary,
} from "../controllers/admin";

import {
  admin_get_all_restaurants,
  admin_get_restaurant_by_id,
  admin_approve_restaurant,
  admin_reject_restaurant,
  admin_block_restaurant,
  admin_delete_restaurant,
  admin_get_all_food_orders,
  admin_get_food_order_by_id,
  admin_update_food_order_status,
  admin_cancel_food_order,
  admin_delete_food_order,
  admin_get_restaurant_menu,
  admin_toggle_menu_item,
  admin_delete_menu_item,
} from "../controllers/adminFood";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

AdminRouter.post("/register", register);
AdminRouter.post("/login", login);

AdminRouter.get("/data", auth, get_admin_data);
AdminRouter.patch("/profile", auth, update_profile);
AdminRouter.patch("/password", auth, update_password);
AdminRouter.patch(
  "/profile_pic",
  [auth, upload.single("profile_pic")],
  upload_profile_pic
);
AdminRouter.patch("/remove_pic", auth, remove_profile_pic);
AdminRouter.get("/summary", auth, summary);

// ─── Restaurant Admin Routes ─────────────────────────────────────────────────
AdminRouter.get("/restaurants", auth, admin_get_all_restaurants);
AdminRouter.get("/restaurants/:id", auth, admin_get_restaurant_by_id);
AdminRouter.get("/restaurants/:id/menu", auth, admin_get_restaurant_menu);
AdminRouter.patch("/restaurants/:id/approve", auth, admin_approve_restaurant);
AdminRouter.patch("/restaurants/:id/reject", auth, admin_reject_restaurant);
AdminRouter.patch("/restaurants/:id/block", auth, admin_block_restaurant);
AdminRouter.delete("/restaurants/:id", auth, admin_delete_restaurant);

// ─── Food Order Admin Routes ──────────────────────────────────────────────────
AdminRouter.get("/food-orders", auth, admin_get_all_food_orders);
AdminRouter.get("/food-orders/:id", auth, admin_get_food_order_by_id);
AdminRouter.patch("/food-orders/:id/status", auth, admin_update_food_order_status);
AdminRouter.patch("/food-orders/:id/cancel", auth, admin_cancel_food_order);
AdminRouter.delete("/food-orders/:id", auth, admin_delete_food_order);

// ─── Menu Admin Routes ────────────────────────────────────────────────────────
AdminRouter.patch("/menu-items/:id/toggle", auth, admin_toggle_menu_item);
AdminRouter.delete("/menu-items/:id", auth, admin_delete_menu_item);

export default AdminRouter;
