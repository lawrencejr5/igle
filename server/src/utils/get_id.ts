import Driver from "../models/driver";
import User from "../models/user";

import { Types } from "mongoose";

export const get_driver_id = async (user_id: string) => {
  const driver = await Driver.findOne({ user: user_id });
  return driver?._id;
};

export const get_driver_user_id = async (driver_id: string) => {
  const driver = await Driver.findById(driver_id);
  return driver?.user;
};

export const get_user_socket_id = async (user_id: string | Types.ObjectId) => {
  const user = await User.findById(user_id);
  return user?.socket_id;
};

export const get_driver_socket_id = async (
  user_id: string | Types.ObjectId
) => {
  const driver = await Driver.findById(user_id);
  return driver?.socket_id;
};

export const get_user_push_tokens = async (
  user_id: string | Types.ObjectId
) => {
  const user = await User.findById(user_id).select("expo_push_tokens");
  return user && Array.isArray(user.expo_push_tokens)
    ? user.expo_push_tokens
    : [];
};

export const get_driver_push_tokens = async (
  driver_id: string | Types.ObjectId
) => {
  // Driver model may reference a user; try driver.expo_push_tokens first, otherwise fetch the user
  const driver = await Driver.findById(driver_id).populate({
    path: "user",
    select: "expo_push_tokens",
  });
  if (!driver || !driver.user) return [];

  // fall back to linked user
  if (driver.user) {
    return Array.isArray((driver.user as any).expo_push_tokens)
      ? (driver.user as any).expo_push_tokens
      : [];
  }
  return [];
};
