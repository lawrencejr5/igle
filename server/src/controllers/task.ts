import { Request, Response } from "express";
import Task from "../models/task";

// List tasks (supports pagination, search, and filters)
export const get_tasks = async (req: Request, res: Response) => {
  try {
    const {
      active,
      type,
      search,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const queries: any = {};

    // Active filter
    if (active !== undefined) queries.active = active === "true";

    // Type filter
    if (type) queries.type = type;

    // Date range filter
    if (dateFrom || dateTo) {
      queries.createdAt = {};
      if (dateFrom) queries.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) queries.createdAt.$lte = new Date(dateTo as string);
    }

    // Search filter (search across title, description, type)
    if (search) {
      const searchRegex = new RegExp(search as string, "i");
      queries.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { type: searchRegex },
      ];
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(queries).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Task.countDocuments(queries),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
      msg: "success",
      tasks,
      total,
      page: pageNum,
      pages,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_task = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.status(200).json({ msg: "success", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

export const create_task = async (req: Request, res: Response) => {
  try {
    if ((req.user as any)?.role !== "admin")
      return res
        .status(403)
        .json({ msg: "admin role required for this action" });
    const {
      title,
      description,
      type,
      goalCount,
      rewardAmount,
      active,
      startAt,
      endAt,
      terms,
      maxPerUser,
      totalBudget,
    } = req.body;

    if (!title || goalCount === undefined || rewardAmount === undefined) {
      return res
        .status(400)
        .json({ msg: "title, goalCount and rewardAmount are required" });
    }

    const task = await Task.create({
      title,
      description,
      type,
      goalCount,
      rewardAmount,
      active,
      startAt,
      endAt,
      terms,
      maxPerUser,
      totalBudget,
    });

    res.status(201).json({ msg: "Task created", task });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: err.message || "Server error" });
  }
};

export const update_task = async (req: Request, res: Response) => {
  try {
    if ((req.user as any)?.role !== "admin")
      return res
        .status(403)
        .json({ msg: "admin role required for this action" });
    const { id } = req.params;
    const payload = req.body;

    const task = await Task.findByIdAndUpdate(id, payload, { new: true });
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.status(200).json({ msg: "Task updated", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

export const delete_task = async (req: Request, res: Response) => {
  try {
    if ((req.user as any)?.role !== "admin")
      return res
        .status(403)
        .json({ msg: "admin role required for this action" });
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ msg: "Task not found" });
    res.status(200).json({ msg: "Task deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

export default {};
