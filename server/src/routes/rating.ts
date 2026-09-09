import { Router } from "express";
const RatingRouter = Router();

import { auth } from "../middleware/auth";
RatingRouter.use(auth);

import {
  create_rating,
  get_ride_ratings,
  get_food_order_ratings,
  get_driver_ratings,
  get_restaurant_ratings,
  get_user_ratings,
  reply_to_rating,
} from "../controllers/rating";

RatingRouter.post("/", create_rating);
RatingRouter.get("/ride", get_ride_ratings);
RatingRouter.get("/order", get_food_order_ratings);
RatingRouter.get("/driver", get_driver_ratings);
RatingRouter.get("/restaurant", get_restaurant_ratings);
RatingRouter.get("/user", get_user_ratings);
RatingRouter.patch("/:id/reply", reply_to_rating);

export default RatingRouter;
