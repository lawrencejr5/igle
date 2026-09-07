import { Request, Response } from "express";
import Restaurant, { RestaurantType } from "../models/restaurant";

/**
 * Helper to verify user authentication and restaurant ownership.
 * Returns the restaurant document if authenticated and found, or sends an HTTP error response and returns null.
 */
export const getVendorRestaurant = async (
  req: Request,
  res: Response
): Promise<RestaurantType | null> => {
  const user_id = req.user?.id;
  if (!user_id) {
    res.status(401).json({ msg: "User not authenticated" });
    return null;
  }

  const restaurant = await Restaurant.findOne({
    user: user_id,
    is_deleted: { $ne: true },
  });

  if (!restaurant) {
    res.status(404).json({
      msg: "Restaurant profile not found. Please complete restaurant registration first.",
    });
    return null;
  }

  return restaurant;
};
