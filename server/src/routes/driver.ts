import { Router } from "express";

import {
  create_driver,
  update_location,
  get_driver,
  save_bank_info,
  set_driver_availability,
  update_vehicle_info,
  update_driver_license,
  set_driver_online_status,
  get_driver_by_user,
  update_driver_rating,
  update_driver_info,
  get_driver_active_ride,
  get_driver_transactions,
  get_driver_completed_rides,
  get_driver_cancelled_rides,
  get_driver_rides_history,
} from "../controllers/driver";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const DriverRouter = Router();

DriverRouter.use(auth);

DriverRouter.get("/data", get_driver);
DriverRouter.get("/profile/me", get_driver_by_user);
DriverRouter.post("/create", upload.single("profile_img"), create_driver);
DriverRouter.patch("/location", update_location);
DriverRouter.patch("/bank", save_bank_info);
DriverRouter.patch("/available", set_driver_availability);
DriverRouter.patch(
  "/vehicle",
  upload.fields([
    { name: "vehicle_exterior", maxCount: 1 },
    { name: "vehicle_interior", maxCount: 1 },
  ]),
  update_vehicle_info
);
DriverRouter.patch(
  "/license",
  upload.fields([
    { name: "license_front", maxCount: 1 },
    { name: "license_back", maxCount: 1 },
    { name: "selfie_with_license", maxCount: 1 },
  ]),
  update_driver_license
);
DriverRouter.patch("/online", set_driver_online_status);
DriverRouter.patch("/rating", update_driver_rating);
DriverRouter.patch("/info", update_driver_info);
DriverRouter.get("/ride/active", get_driver_active_ride);
DriverRouter.get("/rides/completed", get_driver_completed_rides);
DriverRouter.get("/rides/cancelled", get_driver_cancelled_rides);
DriverRouter.get("/rides/history", get_driver_rides_history);
DriverRouter.get("/transactions", get_driver_transactions);

export default DriverRouter;
