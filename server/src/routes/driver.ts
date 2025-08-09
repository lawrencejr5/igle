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
} from "../controllers/driver";

import { auth } from "../middleware/auth";

const DriverRouter = Router();

DriverRouter.use(auth);

DriverRouter.get("/:id", get_driver);
DriverRouter.get("/profile/me", get_driver_by_user);
DriverRouter.post("/create", create_driver);
DriverRouter.patch("/location", update_location);
DriverRouter.patch("/bank", save_bank_info);
DriverRouter.patch("/available", set_driver_availability);
DriverRouter.patch("/vehicle", update_vehicle_info);
DriverRouter.patch("/license", update_driver_license);
DriverRouter.patch("/online", set_driver_online_status);
DriverRouter.patch("/rating", update_driver_rating);
DriverRouter.patch("/info", update_driver_info);

export default DriverRouter;
