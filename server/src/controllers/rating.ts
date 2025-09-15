import { Request, Response } from "express";
import Rating from "../models/rating";

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
    res.status(200).json({ msg: "Success", ratings });
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
