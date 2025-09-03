import { Request, Response } from "express";
import History from "../models/history";

// Create a new history entry
export const add_history = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { place_id, place_name } = req.body;

    if (!place_id || !place_name) {
      res.status(400).json({ msg: "place_id and place_name are required." });
      return;
    }

    const history = await History.create({
      place_id,
      place_name,
      user: user_id,
    });

    res.status(201).json({ msg: "History added successfully.", history });
  } catch (err: any) {
    res.status(500).json({ msg: "Failed to add history.", err: err.message });
  }
};

export const get_user_history = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const histories = await History.aggregate([
      { $match: { user: user_id } },
      {
        $group: {
          _id: "$place_id",
          place_id: { $first: "$place_id" },
          place_name: { $first: "$place_name" },
          user: { $first: "$user" },
          created_at: { $first: "$created_at" },
        },
      },
      { $sort: { created_at: -1 } },
    ]);
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
