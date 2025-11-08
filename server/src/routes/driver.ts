import { Router } from "express";

import {
  create_driver,
  upload_driver_profile_pic,
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
  get_driver_active_delivery,
  get_driver_transactions,
  get_driver_completed_rides,
  get_driver_cancelled_rides,
  get_driver_rides_history,
  get_driver_delivered_deliveries,
  get_driver_cancelled_deliveries,
  admin_get_driver,
  admin_edit_driver,
  admin_delete_driver,
  admin_block_driver,
} from "../controllers/driver";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

const DriverRouter = Router();

DriverRouter.use(auth);

DriverRouter.get("/data", get_driver);
DriverRouter.get("/profile/me", get_driver_by_user);
DriverRouter.post("/create", upload.single("profile_img"), create_driver);
DriverRouter.patch(
  "/profile_pic",
  upload.single("profile_img"),
  upload_driver_profile_pic
);
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
DriverRouter.get("/delivery/active", get_driver_active_delivery);
DriverRouter.get("/rides/completed", get_driver_completed_rides);
DriverRouter.get("/rides/cancelled", get_driver_cancelled_rides);
DriverRouter.get("/rides/history", get_driver_rides_history);
DriverRouter.get("/deliveries/delivered", get_driver_delivered_deliveries);
DriverRouter.get("/deliveries/cancelled", get_driver_cancelled_deliveries);
DriverRouter.get("/transactions", get_driver_transactions);

// Admin driver management (query-based id: ?id=...)
DriverRouter.get("/admin/driver", admin_get_driver);
DriverRouter.patch("/admin/driver", admin_edit_driver);
DriverRouter.delete("/admin/driver", admin_delete_driver);
DriverRouter.patch("/admin/driver/block", admin_block_driver);

export default DriverRouter;
