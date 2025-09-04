import { Request, Response } from "express";
import History from "../models/history";
import mongoose from "mongoose";

// Create a new history entry
export const add_history = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { place_id, place_name, place_sub_name } = req.body;

    if (!user_id || !place_id || !place_name || !place_sub_name) {
      res.status(400).json({
        msg: "Al fields are required.",
      });
      return;
    }

    const history = await History.findOneAndUpdate(
      { user: user_id, place_id },
      {
        place_name,
        place_sub_name,
        lastVisitedAt: new Date(), // refresh visit timestamp
      },
      {
        new: true,
        upsert: true, // create if not exists
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({ msg: "History saved successfully.", history });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Failed to save history.", err: err.message });
  }
};

export const get_user_history = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const histories = await History.find({ user: user_id })
      .limit(5)
      .sort({ lastVisitedAt: -1 });
    res
      .status(200)
      .json({ msg: "success", rowCount: histories.length, histories });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Delete a history entry
export const delete_history = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { place_id } = req.query;
    const user_id = req.user?.id;

    const history = await History.deleteMany({
      user: user_id,
      place_id,
    });
    if (!history) {
      res.status(404).json({ msg: "History not found." });
      return;
    }

    res.status(200).json({ msg: "History deleted successfully." });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};
