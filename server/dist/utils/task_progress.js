"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementUserTasksProgress = void 0;
const task_1 = __importDefault(require("../models/task"));
const userTask_1 = __importDefault(require("../models/userTask"));
// Increment progress by 1 for all active tasks of a given type for a user.
// Creates a UserTask if missing. Does not modify already-claimed tasks.
const incrementUserTasksProgress = (userId, type) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    // Find all active tasks of this type within active window (if any)
    const activeTasks = yield task_1.default.find({
        type,
        active: true,
        $and: [
            { $or: [{ startAt: null }, { startAt: { $lte: now } }] },
            { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
        ],
    });
    if (!activeTasks.length)
        return { updated: 0 };
    let updated = 0;
    for (const task of activeTasks) {
        let userTask = yield userTask_1.default.findOne({ user: userId, task: task._id });
        if (!userTask) {
            userTask = yield userTask_1.default.create({
                user: userId,
                task: task._id,
                progress: 0,
                status: "locked",
            });
        }
        // Do not change already claimed tasks
        if (userTask.status === "claimed")
            continue;
        const next = Math.min(task.goalCount, (userTask.progress || 0) + 1);
        userTask.progress = next;
        if (next >= task.goalCount) {
            userTask.status = "completed";
        }
        else if (next > 0) {
            userTask.status = "in_progress";
        }
        yield userTask.save();
        updated += 1;
    }
    return { updated };
});
exports.incrementUserTasksProgress = incrementUserTasksProgress;
