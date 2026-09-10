"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const restaurant_1 = require("../controllers/restaurant");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const RestaurantRouter = (0, express_1.Router)();
RestaurantRouter.use(auth_1.auth);
RestaurantRouter.get("/all", restaurant_1.get_all_restaurants);
RestaurantRouter.get("/me", restaurant_1.get_restaurant_profile);
RestaurantRouter.get("/:id", restaurant_1.get_restaurant_by_id);
// Stage 1: Details
RestaurantRouter.post("/save-details", upload_1.upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
]), restaurant_1.save_restaurant_details);
// Stage 2: Location
RestaurantRouter.post("/save-location", restaurant_1.save_restaurant_location);
// Stage 3: Bank
RestaurantRouter.post("/save-bank", restaurant_1.save_restaurant_bank);
// Stage 4: Verification & Submit
RestaurantRouter.post("/save-verification", upload_1.upload.fields([
    { name: "government_id", maxCount: 1 },
    { name: "cac_document", maxCount: 1 },
]), restaurant_1.submit_restaurant_verification);
// Legacy/Full Registration
RestaurantRouter.post("/register", upload_1.upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
    { name: "government_id", maxCount: 1 },
    { name: "cac_document", maxCount: 1 },
]), restaurant_1.register_restaurant);
RestaurantRouter.patch("/online", restaurant_1.set_restaurant_online_status);
exports.default = RestaurantRouter;
