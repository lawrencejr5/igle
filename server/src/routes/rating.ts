import { Router } from "express";
const RatingRouter = Router();

import { auth } from "../middleware/auth";
RatingRouter.use(auth);

import {
  create_rating,
  get_ride_ratings,
  get_driver_ratings,
  get_user_ratings,
} from "../controllers/rating";

RatingRouter.post("/", create_rating);
RatingRouter.get("/ride", get_ride_ratings);
RatingRouter.get("/driver", get_driver_ratings);
RatingRouter.get("/user", get_user_ratings);

export default RatingRouter;
