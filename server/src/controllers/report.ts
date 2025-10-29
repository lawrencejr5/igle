import { Request, Response } from "express";
import Report from "../models/report";

// Create a new report
export const create_report = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { driver_id, ride_id, category, description, anonymous } = req.body;

    if (!driver_id || !category) {
      res.status(400).json({ msg: "driver_id and category are required." });
      return;
    }

    const report = await Report.create({
      reporter: anonymous ? null : user_id || null,
      driver: driver_id,
      ride: ride_id || null,
      category,
      description: description || "",
      anonymous: !!anonymous,
      status: "new",
    });

    res.status(201).json({ msg: "Report submitted.", report });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Failed to submit report.", err: err.message });
  }
};

// (Optional) Get reports - for admin/ops (basic implementation)
export const get_reports = async (req: Request, res: Response) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ msg: "success", rowCount: reports.length, reports });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};
