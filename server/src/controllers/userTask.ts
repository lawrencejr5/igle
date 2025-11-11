import { Request, Response } from "express";
import UserTask from "../models/userTask";
import Task from "../models/task";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import { credit_wallet } from "../utils/wallet";
import { Types } from "mongoose";

// get current user's tasks
export const get_user_tasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const tasks = await UserTask.find({ user: userId }).populate("task");
    res.status(200).json({ msg: "success", tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// get a user's task by task id
export const get_user_task = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    const userTask = await UserTask.findOne({
      user: userId,
      task: taskId,
    }).populate("task");
    if (!userTask) return res.status(404).json({ msg: "UserTask not found" });
    res.status(200).json({ msg: "success", task: userTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// ensure userTask exists (create if missing)
export const ensure_user_task = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    let userTask = await UserTask.findOne({ user: userId, task: taskId });
    if (!userTask) {
      userTask = await UserTask.create({
        user: userId,
        task: taskId,
        progress: 0,
      });
    }
    await userTask.populate("task");
    res.status(200).json({ msg: "success", task: userTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// update progress (increment by given amount)
export const update_progress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;
    const { increment = 1 } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    if (Number(increment) <= 0) {
      return res
        .status(400)
        .json({ msg: "increment must be a positive number" });
    }

    let userTask = await UserTask.findOne({ user: userId, task: taskId });
    if (!userTask)
      userTask = await UserTask.create({
        user: userId,
        task: taskId,
        progress: 0,
      });

    userTask.progress = (userTask.progress || 0) + Number(increment);
    // cap at goalCount
    if (userTask.progress >= task.goalCount) {
      userTask.progress = task.goalCount;
      userTask.status = "completed";
    } else if (userTask.progress > 0) {
      userTask.status = "in_progress";
    }

    await userTask.save();
    await userTask.populate("task");
    res.status(200).json({ msg: "Progress updated", task: userTask });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// claim a completed task (credit wallet)
export const claim_task = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { taskId } = req.params;

    const userTask = await UserTask.findOne({ user: userId, task: taskId });
    if (!userTask) return res.status(404).json({ msg: "UserTask not found" });

    if (userTask.status === "claimed") {
      return res.status(200).json({ msg: "Task already claimed" });
    }

    if (userTask.status !== "completed") {
      return res.status(400).json({ msg: "Task not yet eligible for claim" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ msg: "Task not found" });

    const wallet = await Wallet.findOne({ owner_id: userId });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    // create pending transaction and then credit via existing util
    const reference = generate_unique_reference();
    await Transaction.create({
      wallet_id: wallet._id as any,
      type: "funding",
      amount: Number((task as any).rewardAmount || 0),
      status: "pending",
      channel: "wallet",
      reference,
      metadata: { for: "task_reward", task_id: task._id, user_id: userId },
    });

    // credit wallet (reuses existing logic and marks transaction success)
    const creditResult = await credit_wallet(reference);

    userTask.status = "claimed";
    userTask.claimedAt = new Date();
    await userTask.save();

    res.status(200).json({ msg: "Task claimed", creditResult });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: err.message || "Server error." });
  }
};

// --- Admin: Get all user tasks ---
export const admin_get_all_user_tasks = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const userTasks = await UserTask.find()
      .populate("user", "name email")
      .populate("task");
    return res.status(200).json({ msg: "success", tasks: userTasks });
  } catch (err) {
    console.error("admin_get_all_user_tasks error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// --- Admin: Force-end a user's task (mark completed) ---
export const admin_end_user_task = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");

    let userTask = null as any;

    if (id) {
      userTask = await UserTask.findById(id);
    } else {
      const user = req.query.user || req.body?.user;
      const taskId = req.query.task || req.body?.task;
      if (!user || !taskId)
        return res
          .status(400)
          .json({ msg: "id or user and task are required" });
      userTask = await UserTask.findOne({ user, task: taskId });
    }

    if (!userTask) return res.status(404).json({ msg: "UserTask not found" });

    // set progress to goalCount if task known
    const task = await Task.findById(userTask.task);
    const goal = task?.goalCount ?? userTask.progress ?? 0;

    userTask.progress = goal;
    userTask.status = "completed";
    userTask.completedAt = new Date();
    await userTask.save();
    await userTask.populate("task");

    return res
      .status(200)
      .json({ msg: "UserTask marked completed", task: userTask });
  } catch (err) {
    console.error("admin_end_user_task error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// --- Admin: Delete a user's task record ---
export const admin_delete_user_task = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");

    let deleted = null as any;

    if (id) {
      deleted = await UserTask.findByIdAndDelete(id);
    } else {
      const user = req.query.user || req.body?.user;
      const taskId = req.query.task || req.body?.task;
      if (!user || !taskId)
        return res
          .status(400)
          .json({ msg: "id or user and task are required" });
      deleted = await UserTask.findOneAndDelete({ user, task: taskId });
    }

    if (!deleted) return res.status(404).json({ msg: "UserTask not found" });

    return res.status(200).json({ msg: "UserTask deleted" });
  } catch (err) {
    console.error("admin_delete_user_task error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

export default {};
