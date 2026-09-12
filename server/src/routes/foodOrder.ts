import { Router } from "express";
import {
  place_food_order,
  accept_food_order,
  reject_food_order,
  mark_order_ready,
  mark_order_delivered,
  cancel_food_order,
  get_customer_orders,
  get_vendor_orders,
  get_order_by_id,
} from "../controllers/foodOrder";
import { auth } from "../middleware/auth";

const FoodOrderRouter = Router();

FoodOrderRouter.use(auth);

// Order Placement & Customer Routes
FoodOrderRouter.post("/place", place_food_order);
FoodOrderRouter.get("/customer", get_customer_orders);
FoodOrderRouter.post("/:id/cancel", cancel_food_order);

// Vendor Order Routes
FoodOrderRouter.get("/vendor", get_vendor_orders);
FoodOrderRouter.post("/:id/accept", accept_food_order);
FoodOrderRouter.post("/:id/reject", reject_food_order);
FoodOrderRouter.post("/:id/ready", mark_order_ready);
FoodOrderRouter.post("/:id/deliver", mark_order_delivered);

// Order Details
FoodOrderRouter.get("/:id", get_order_by_id);


export default FoodOrderRouter;
