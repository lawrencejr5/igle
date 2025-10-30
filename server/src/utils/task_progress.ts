import Task from "../models/task";
import UserTask from "../models/userTask";
import { Types } from "mongoose";

type ProgressType = "ride" | "delivery" | "streak" | "referral" | "custom";

// Increment progress by 1 for all active tasks of a given type for a user.
// Creates a UserTask if missing. Does not modify already-claimed tasks.
export const incrementUserTasksProgress = async (
  userId: Types.ObjectId | string,
  type: ProgressType
) => {
  const now = new Date();

  // Find all active tasks of this type within active window (if any)
  const activeTasks = await Task.find({
    type,
    active: true,
    $and: [
      { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
      { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
    ],
  });

  if (!activeTasks.length) return { updated: 0 };

  let updated = 0;
  for (const task of activeTasks) {
    let userTask = await UserTask.findOne({ user: userId, task: task._id });
    if (!userTask) {
      userTask = await UserTask.create({
        user: userId as any,
        task: task._id as any,
        progress: 0,
        status: "locked",
      });
    }

    // Do not change already claimed tasks
    if (userTask.status === "claimed") continue;

    const next = Math.min(task.goalCount, (userTask.progress || 0) + 1);
    userTask.progress = next;
    if (next >= task.goalCount) {
      userTask.status = "completed";
    } else if (next > 0) {
      userTask.status = "in_progress";
    }

    await userTask.save();
    updated += 1;
  }

  return { updated };
};
