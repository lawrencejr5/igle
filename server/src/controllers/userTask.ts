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

export default {};
