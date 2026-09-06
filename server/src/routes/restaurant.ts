import { Router } from "express";
import {
  register_restaurant,
  get_restaurant_profile,
  set_restaurant_online_status,
} from "../controllers/restaurant";
import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const RestaurantRouter = Router();

RestaurantRouter.use(auth);

RestaurantRouter.get("/me", get_restaurant_profile);

RestaurantRouter.post(
  "/register",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
    { name: "government_id", maxCount: 1 },
    { name: "cac_document", maxCount: 1 },
  ]),
  register_restaurant
);

RestaurantRouter.patch("/online", set_restaurant_online_status);

export default RestaurantRouter;
