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
} from "../controllers/ride";

const RideRouter = Router();

RideRouter.use(auth);

RideRouter.post("/request", request_ride);
RideRouter.get("/available", get_available_rides);
RideRouter.patch("/accept", accept_ride);
RideRouter.patch("/cancel", cancel_ride);
RideRouter.get("/data", get_ride_data);
RideRouter.get("/user", get_user_rides);
RideRouter.patch("/status", update_ride_status);
RideRouter.post("/pay", pay_for_ride);

export default RideRouter;
