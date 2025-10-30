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
exports.claim_task = exports.update_progress = exports.ensure_user_task = exports.get_user_task = exports.get_user_tasks = void 0;
const userTask_1 = __importDefault(require("../models/userTask"));
const task_1 = __importDefault(require("../models/task"));
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const wallet_2 = require("../utils/wallet");
// get current user's tasks
const get_user_tasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const tasks = yield userTask_1.default.find({ user: userId }).populate("task");
        res.status(200).json({ msg: "success", tasks });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_tasks = get_user_tasks;
// get a user's task by task id
const get_user_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { taskId } = req.params;
        const userTask = yield userTask_1.default.findOne({
            user: userId,
            task: taskId,
        }).populate("task");
        if (!userTask)
            return res.status(404).json({ msg: "UserTask not found" });
        res.status(200).json({ msg: "success", task: userTask });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_user_task = get_user_task;
// ensure userTask exists (create if missing)
const ensure_user_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { taskId } = req.params;
        let userTask = yield userTask_1.default.findOne({ user: userId, task: taskId });
        if (!userTask) {
            userTask = yield userTask_1.default.create({
                user: userId,
                task: taskId,
                progress: 0,
            });
        }
        yield userTask.populate("task");
        res.status(200).json({ msg: "success", task: userTask });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.ensure_user_task = ensure_user_task;
// update progress (increment by given amount)
const update_progress = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { taskId } = req.params;
        const { increment = 1 } = req.body;
        const task = yield task_1.default.findById(taskId);
        if (!task)
            return res.status(404).json({ msg: "Task not found" });
        if (Number(increment) <= 0) {
            return res
                .status(400)
                .json({ msg: "increment must be a positive number" });
        }
        let userTask = yield userTask_1.default.findOne({ user: userId, task: taskId });
        if (!userTask)
            userTask = yield userTask_1.default.create({
                user: userId,
                task: taskId,
                progress: 0,
            });
        userTask.progress = (userTask.progress || 0) + Number(increment);
        // cap at goalCount
        if (userTask.progress >= task.goalCount) {
            userTask.progress = task.goalCount;
            userTask.status = "completed";
        }
        else if (userTask.progress > 0) {
            userTask.status = "in_progress";
        }
        yield userTask.save();
        yield userTask.populate("task");
        res.status(200).json({ msg: "Progress updated", task: userTask });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_progress = update_progress;
// claim a completed task (credit wallet)
const claim_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const { taskId } = req.params;
        const userTask = yield userTask_1.default.findOne({ user: userId, task: taskId });
        if (!userTask)
            return res.status(404).json({ msg: "UserTask not found" });
        if (userTask.status === "claimed") {
            return res.status(200).json({ msg: "Task already claimed" });
        }
        if (userTask.status !== "completed") {
            return res.status(400).json({ msg: "Task not yet eligible for claim" });
        }
        const task = yield task_1.default.findById(taskId);
        if (!task)
            return res.status(404).json({ msg: "Task not found" });
        const wallet = yield wallet_1.default.findOne({ owner_id: userId });
        if (!wallet)
            return res.status(404).json({ msg: "Wallet not found" });
        // create pending transaction and then credit via existing util
        const reference = (0, gen_unique_ref_1.generate_unique_reference)();
        yield transaction_1.default.create({
            wallet_id: wallet._id,
            type: "funding",
            amount: Number(task.rewardAmount || 0),
            status: "pending",
            channel: "wallet",
            reference,
            metadata: { for: "task_reward", task_id: task._id, user_id: userId },
        });
        // credit wallet (reuses existing logic and marks transaction success)
        const creditResult = yield (0, wallet_2.credit_wallet)(reference);
        userTask.status = "claimed";
        userTask.claimedAt = new Date();
        yield userTask.save();
        res.status(200).json({ msg: "Task claimed", creditResult });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || "Server error." });
    }
});
exports.claim_task = claim_task;
exports.default = {};
