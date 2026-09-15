"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const foodOrder_1 = require("../controllers/foodOrder");
const auth_1 = require("../middleware/auth");
const FoodOrderRouter = (0, express_1.Router)();
FoodOrderRouter.use(auth_1.auth);
// Order Placement & Customer Routes
FoodOrderRouter.post("/place", foodOrder_1.place_food_order);
FoodOrderRouter.get("/customer", foodOrder_1.get_customer_orders);
FoodOrderRouter.post("/:id/cancel", foodOrder_1.cancel_food_order);
// Vendor Order Routes
FoodOrderRouter.get("/vendor", foodOrder_1.get_vendor_orders);
FoodOrderRouter.post("/:id/accept", foodOrder_1.accept_food_order);
FoodOrderRouter.post("/:id/reject", foodOrder_1.reject_food_order);
FoodOrderRouter.post("/:id/ready", foodOrder_1.mark_order_ready);
FoodOrderRouter.post("/:id/deliver", foodOrder_1.mark_order_delivered);
// Order Details & Delivery Tracking
FoodOrderRouter.get("/:id/delivery", foodOrder_1.get_food_order_delivery_status);
FoodOrderRouter.get("/:id", foodOrder_1.get_order_by_id);
exports.default = FoodOrderRouter;
