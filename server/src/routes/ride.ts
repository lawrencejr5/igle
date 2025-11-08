import { Router } from "express";

import { auth } from "../middleware/auth";

import {
  request_ride,
  get_available_rides,
  accept_ride,
  cancel_ride,
  get_ride_data,
  get_user_rides,
  update_ride_status,
  pay_for_ride,
  get_user_active_ride,
  rebook_ride,
  retry_ride,
  get_user_scheduled_rides,
  get_user_ongoing_ride,
  admin_get_rides,
  admin_get_ride,
  admin_cancel_ride,
  admin_delete_ride,
} from "../controllers/ride";

const RideRouter = Router();

RideRouter.use(auth);

RideRouter.get("/active", get_user_active_ride);
RideRouter.get("/ongoing", get_user_ongoing_ride);
RideRouter.get("/scheduled", get_user_scheduled_rides);
RideRouter.post("/request", request_ride);
RideRouter.patch("/retry", retry_ride);
RideRouter.post("/rebook", rebook_ride);
RideRouter.get("/available", get_available_rides);
RideRouter.patch("/accept", accept_ride);
RideRouter.patch("/cancel", cancel_ride);
RideRouter.get("/data", get_ride_data);
RideRouter.get("/user", get_user_rides);
RideRouter.patch("/status", update_ride_status);
RideRouter.post("/pay", pay_for_ride);

// Admin ride management
RideRouter.get("/admin/rides", admin_get_rides);
RideRouter.get("/admin/rides/data", admin_get_ride);
RideRouter.patch("/admin/rides/cancel", admin_cancel_ride);
RideRouter.delete("/admin/rides", admin_delete_ride);

export default RideRouter;
