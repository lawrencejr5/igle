import { Router } from "express";

import { auth } from "../middleware/auth";

import { request_ride } from "../controllers/ride";

const RideRouter = Router();

RideRouter.post("/request", auth, request_ride);

export default RideRouter;
