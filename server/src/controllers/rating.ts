import { Request, Response } from "express";
import Rating from "../models/rating";
import Driver from "../models/driver";
import Restaurant from "../models/restaurant";

import { io } from "../server";
import { get_driver_socket_id, get_user_socket_id } from "../utils/get_id";

// 1. Create Rating (Rider -> Driver OR Customer -> Restaurant)
export const create_rating = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    const { rating, review, ride, driver, food_order, restaurant } = req.body;

    if (!user || !rating) {
      return res.status(400).json({ msg: "User authentication and rating score are required" });
    }

    if (!driver && !restaurant) {
      return res.status(400).json({ msg: "Target driver or restaurant is required for rating" });
    }

    const newRating = await Rating.create({
      rating: Number(rating),
      review: review || "",
      user,
      ride: ride || undefined,
      driver: driver || undefined,
      food_order: food_order || undefined,
      restaurant: restaurant || undefined,
    });

    // If rating a driver
    if (driver) {
      const driverRatings = await Rating.find({ driver });
      let driverAverage = 0;
      if (driverRatings.length > 0) {
        const total = driverRatings.reduce((sum, r) => sum + r.rating, 0);
        driverAverage = total / driverRatings.length;
        driverAverage = Math.round(driverAverage * 10) / 10;
        if (driverAverage % 1 === 0) driverAverage = Math.floor(driverAverage);
      }

      const driverData = await Driver.findById(driver);
      if (driverData) {
        driverData.rating = driverAverage;
        driverData.num_of_reviews = driverRatings.length;
        await driverData.save();

        const driverSocket = await get_driver_socket_id(driver);
        if (driverSocket) {
          io.to(driverSocket).emit("driver_reviewed", {
            msg: "You received a new rating",
            rating: driverAverage,
          });
        }
      }
    }

    // If rating a restaurant
    if (restaurant) {
      const restaurantRatings = await Rating.find({ restaurant });
      let restaurantAverage = 5.0;
      if (restaurantRatings.length > 0) {
        const total = restaurantRatings.reduce((sum, r) => sum + r.rating, 0);
        restaurantAverage = total / restaurantRatings.length;
        restaurantAverage = Math.round(restaurantAverage * 10) / 10;
        if (restaurantAverage % 1 === 0) restaurantAverage = Math.floor(restaurantAverage);
      }

      const restaurantData = await Restaurant.findById(restaurant);
      if (restaurantData) {
        restaurantData.rating = restaurantAverage;
        restaurantData.num_of_reviews = restaurantRatings.length;
        await restaurantData.save();

        if (restaurantData.user) {
          const vendorSocket = await get_user_socket_id(restaurantData.user);
          if (vendorSocket) {
            io.to(vendorSocket).emit("restaurant_reviewed", {
              msg: "Your restaurant received a new review",
              rating: restaurantAverage,
            });
          }
        }
      }
    }

    return res.status(201).json({
      msg: "Rating submitted successfully",
      rating: newRating,
    });
  } catch (error: any) {
    console.error("create_rating error:", error);
    return res.status(500).json({ msg: "An error occurred submitting rating", error: error.message });
  }
};

// 2. Get Ride Ratings
export const get_ride_ratings = async (req: Request, res: Response) => {
  try {
    const { ride_id } = req.query;
    if (!ride_id) return res.status(400).json({ msg: "Ride id not provided" });
    const ratings = await Rating.find({ ride: ride_id }).populate("user", "name profile_pic");
    return res.status(200).json({ msg: "Success", ratings });
  } catch (error: any) {
    return res.status(500).json({ msg: "An error occurred" });
  }
};

// 3. Get Food Order Ratings
export const get_food_order_ratings = async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;
    if (!order_id) return res.status(400).json({ msg: "Order id not provided" });
    const ratings = await Rating.find({ food_order: order_id }).populate("user", "name profile_pic");
    return res.status(200).json({ msg: "Success", ratings });
  } catch (error: any) {
    return res.status(500).json({ msg: "An error occurred" });
  }
};

// 4. Get Driver Ratings
export const get_driver_ratings = async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.query;
    if (!driver_id)
      return res.status(400).json({ msg: "Driver id not provided" });

    const ratings = await Rating.find({ driver: driver_id })
      .populate("user", "name profile_pic")
      .sort({ createdAt: -1 });

    let average = 0;
    if (ratings.length > 0) {
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      average = total / ratings.length;
      average = Math.round(average * 10) / 10;
      if (average % 1 === 0) average = Math.floor(average);
    }

    return res.status(200).json({
      msg: "Success",
      reviews: ratings,
      average_rating: average,
      ratings_count: ratings.length,
    });
  } catch (error: any) {
    return res.status(500).json({ msg: "An error occurred" });
  }
};

// 5. Get Restaurant Ratings
export const get_restaurant_ratings = async (req: Request, res: Response) => {
  try {
    const { restaurant_id } = req.query;
    if (!restaurant_id)
      return res.status(400).json({ msg: "Restaurant id not provided" });

    const ratings = await Rating.find({ restaurant: restaurant_id })
      .populate("user", "name profile_pic")
      .sort({ createdAt: -1 });

    let average = 5.0;
    if (ratings.length > 0) {
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      average = total / ratings.length;
      average = Math.round(average * 10) / 10;
      if (average % 1 === 0) average = Math.floor(average);
    }

    return res.status(200).json({
      msg: "Success",
      reviews: ratings,
      average_rating: average,
      ratings_count: ratings.length,
    });
  } catch (error: any) {
    return res.status(500).json({ msg: "An error occurred fetching restaurant ratings" });
  }
};

// 6. Get User Ratings
export const get_user_ratings = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    if (!user) return res.status(404).json({ msg: "User not found" });
    const ratings = await Rating.find({ user }).sort({ createdAt: -1 });
    return res.status(200).json({ msg: "Success", ratings });
  } catch (error: any) {
    return res.status(500).json({ msg: "An error occurred" });
  }
};


