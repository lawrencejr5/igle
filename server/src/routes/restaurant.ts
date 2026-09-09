import { Router } from "express";
import {
  register_restaurant,
  save_restaurant_details,
  save_restaurant_location,
  save_restaurant_bank,
  submit_restaurant_verification,
  get_restaurant_profile,
  set_restaurant_online_status,
  get_all_restaurants,
} from "../controllers/restaurant";
import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const RestaurantRouter = Router();

RestaurantRouter.use(auth);

RestaurantRouter.get("/all", get_all_restaurants);
RestaurantRouter.get("/me", get_restaurant_profile);

// Stage 1: Details
RestaurantRouter.post(
  "/save-details",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  save_restaurant_details
);

// Stage 2: Location
RestaurantRouter.post("/save-location", save_restaurant_location);

// Stage 3: Bank
RestaurantRouter.post("/save-bank", save_restaurant_bank);

// Stage 4: Verification & Submit
RestaurantRouter.post(
  "/save-verification",
  upload.fields([
    { name: "government_id", maxCount: 1 },
    { name: "cac_document", maxCount: 1 },
  ]),
  submit_restaurant_verification
);

// Legacy/Full Registration
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
