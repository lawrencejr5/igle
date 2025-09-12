import { Request, Response } from "express";

import Activity from "../models/activity";

export const create_activity = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { type, title, message, metadata } = req.body;

    if (!type || !title)
      return res.status(404).json({ msg: "Invalid input fields" });

    const activity = await Activity.create({
      type,
      user,
      title,
      message,
      metadata,
    });
    res.status(200).json({ msg: "Activity registered", activity });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const get_user_activities = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    if (!user) return res.status(404).json({ msg: "User not found" });

    const activities = await Activity.find({ user });

    res
      .status(200)
      .json({ msg: "Success", row_count: activities.length, activities });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const remove_activity = async (req: Request, res: Response) => {
  try {
    const user = req.user?.id;
    if (!user) return res.status(404).json({ msg: "User not found" });

    const { activity_id } = req.query;
    if (!activity_id)
      return res.status(404).json({ msg: "Activity id not provided" });

    const deleted_activity = await Activity.findByIdAndDelete(activity_id, {
      user,
    });

    res.status(200).json({ msg: "Activity deleted", deleted_activity });
  } catch (error) {
    res.status(500).json({ msg: "An error occured" });
  }
};
