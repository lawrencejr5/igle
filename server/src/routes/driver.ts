import { Router } from "express";

import {
  create_driver,
  update_location,
  get_driver,
  save_bank_info,
  set_driver_availability,
} from "../controllers/driver";

import { auth } from "../middleware/auth";

const DriverRouter = Router();

DriverRouter.use(auth);

DriverRouter.get("/:id", get_driver);
DriverRouter.post("/create", create_driver);
DriverRouter.patch("/location", update_location);
DriverRouter.patch("/bank", save_bank_info);
DriverRouter.patch("/available", set_driver_availability);

export default DriverRouter;
