import Driver from "../models/driver";

export const get_driver_id = async (user: string) => {
  const driver = await Driver.findOne({ user });
  return driver?._id;
};
