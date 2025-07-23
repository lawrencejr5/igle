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
} from "../controllers/ride";

const RideRouter = Router();

RideRouter.post("/request", auth, request_ride);
RideRouter.get("/available", auth, get_available_rides);
RideRouter.patch("/accept", auth, accept_ride);
RideRouter.patch("/cancel", auth, cancel_ride);
RideRouter.get("/data", auth, get_ride_data);
RideRouter.get("/user", auth, get_user_rides);
RideRouter.patch("/status", auth, update_ride_status);

export default RideRouter;
