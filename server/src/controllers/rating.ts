import { Request, Response } from "express";
import Rating from "../models/rating";
import Driver from "../models/driver";

import { io } from "../server";
import { get_driver_socket_id } from "../utils/get_id";

export const create_rating = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    const { rating, review, ride, driver } = req.body;
    if (!user || !rating || !ride || !driver)
      return res.status(400).json({ msg: "Missing required fields" });

    const newRating = await Rating.create({
      rating,
      review,
      ride,
      user,
      driver,
    });

    // After creating the rating, recalculate the driver's average rating
    const ratings = await Rating.find({ driver });
    let average = 0;
    if (ratings.length > 0) {
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      average = total / ratings.length;
      // Round to one decimal place, but remove trailing .0
      average = Math.round(average * 10) / 10;
      if (average % 1 === 0) average = Math.floor(average);
    }

    // Update the driver's rating field
    const driverData = await Driver.findById(driver);
    if (driverData) {
      driverData.rating = average;
      driverData.num_of_reviews += 1;
      await driverData.save();

      const driver_socket = await get_driver_socket_id(driver);
      if (!driver_socket) console.log("driver socket not found");
      else {
        io.to(driver_socket).emit("driver_reviewed", {
          msg: "You were just reviewed",
        });
      }
    }

    res.status(201).json({ msg: "Rating submitted", rating: newRating });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const get_ride_ratings = async (req: Request, res: Response) => {
  try {
    const { ride_id } = req.query;
    if (!ride_id) return res.status(400).json({ msg: "Ride id not provided" });
    const ratings = await Rating.find({ ride: ride_id });
    res.status(200).json({ msg: "Success", ratings });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const get_driver_ratings = async (req: Request, res: Response) => {
  try {
    const { driver_id } = req.query;
    if (!driver_id)
      return res.status(400).json({ msg: "Driver id not provided" });

    const ratings = await Rating.find({ driver: driver_id });

    // Calculate average rating
    let average = 0;
    if (ratings.length > 0) {
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      average = total / ratings.length;
    }
    if (ratings.length > 0) {
      const total = ratings.reduce((sum, r) => sum + r.rating, 0);
      average = total / ratings.length;
      // Round to one decimal place, but remove trailing .0
      average = Math.round(average * 10) / 10;
      if (average % 1 === 0) average = Math.floor(average); // e.g. 5.0 -> 5
    }

    res.status(200).json({
      msg: "Success",
      reviews: ratings,
      average_rating: average,
      ratings_count: ratings.length,
    });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const get_user_ratings = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    if (!user) return res.status(404).json({ msg: "User not found" });
    const ratings = await Rating.find({ user });
    res.status(200).json({ msg: "Success", ratings });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};
