"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driver_1 = require("../controllers/driver");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const DriverRouter = (0, express_1.Router)();
DriverRouter.use(auth_1.auth);
DriverRouter.get("/data", driver_1.get_driver);
DriverRouter.get("/profile/me", driver_1.get_driver_by_user);
DriverRouter.post("/create", upload_1.upload.single("profile_img"), driver_1.create_driver);
DriverRouter.patch("/location", driver_1.update_location);
DriverRouter.patch("/bank", driver_1.save_bank_info);
DriverRouter.patch("/available", driver_1.set_driver_availability);
DriverRouter.patch("/vehicle", upload_1.upload.fields([
    { name: "vehicle_exterior", maxCount: 1 },
    { name: "vehicle_interior", maxCount: 1 },
]), driver_1.update_vehicle_info);
DriverRouter.patch("/license", upload_1.upload.fields([
    { name: "license_front", maxCount: 1 },
    { name: "license_back", maxCount: 1 },
    { name: "selfie_with_license", maxCount: 1 },
]), driver_1.update_driver_license);
DriverRouter.patch("/online", driver_1.set_driver_online_status);
DriverRouter.patch("/rating", driver_1.update_driver_rating);
DriverRouter.patch("/info", driver_1.update_driver_info);
DriverRouter.get("/ride/active", driver_1.get_driver_active_ride);
DriverRouter.get("/rides/completed", driver_1.get_driver_completed_rides);
DriverRouter.get("/rides/cancelled", driver_1.get_driver_cancelled_rides);
DriverRouter.get("/rides/history", driver_1.get_driver_rides_history);
DriverRouter.get("/transactions", driver_1.get_driver_transactions);
exports.default = DriverRouter;
