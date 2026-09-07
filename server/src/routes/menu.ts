import { Router } from "express";
import {
  create_category,
  get_vendor_categories,
  get_public_categories,
  update_category,
  delete_category,
  create_menu_item,
  get_vendor_menu_items,
  get_public_menu_items,
  get_menu_item_by_id,
  update_menu_item,
  toggle_item_availability,
  delete_menu_item,
} from "../controllers/menu";
import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const MenuRouter = Router();

// ─── Public Endpoints ────────────────────────────────────────────────────────
// Get public menu categories for a restaurant
MenuRouter.get("/categories/restaurant/:restaurantId", get_public_categories);

// Get public menu items for a restaurant (optional query: ?category_id=...)
MenuRouter.get("/items/restaurant/:restaurantId", get_public_menu_items);

// Get details of a single menu item
MenuRouter.get("/items/details/:id", get_menu_item_by_id);

// ─── Vendor Authenticated Endpoints ──────────────────────────────────────────
MenuRouter.use(auth);

// Category Routes
MenuRouter.post("/categories", create_category);
MenuRouter.get("/categories/vendor", get_vendor_categories);
MenuRouter.put("/categories/:id", update_category);
MenuRouter.delete("/categories/:id", delete_category);

// Menu Item Routes
MenuRouter.post("/items", upload.single("image"), create_menu_item);
MenuRouter.get("/items/vendor", get_vendor_menu_items);
MenuRouter.put("/items/:id", upload.single("image"), update_menu_item);
MenuRouter.patch("/items/:id/toggle-availability", toggle_item_availability);
MenuRouter.delete("/items/:id", delete_menu_item);

export default MenuRouter;
