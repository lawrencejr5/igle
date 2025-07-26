import Driver from "../models/driver";
import User from "../models/user";

import { Types } from "mongoose";

export const get_driver_id = async (user_id: string) => {
  const driver = await Driver.findOne({ user: user_id });
  return driver?._id;
};

export const get_user_socket_id = async (user_id: string | Types.ObjectId) => {
  const user = await User.findById(user_id);
  return user?.socket_id;
};
