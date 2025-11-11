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
exports.admin_delete_user_task = exports.admin_end_user_task = exports.admin_get_all_user_tasks = exports.claim_task = exports.update_progress = exports.ensure_user_task = exports.get_user_task = exports.get_user_tasks = exports.admin_restart_user_task = void 0;
// --- Admin: Restart a user's task (reset progress/status) ---
const admin_restart_user_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        let userTask = null;
        if (id) {
            userTask = yield userTask_1.default.findById(id);
        }
        else {
            const user = req.query.user || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.user);
            const taskId = req.query.task || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.task);
            if (!user || !taskId)
                return res
                    .status(400)
                    .json({ msg: "id or user and task are required" });
            userTask = yield userTask_1.default.findOne({ user, task: taskId });
        }
        if (!userTask)
            return res.status(404).json({ msg: "UserTask not found" });
        userTask.progress = 0;
        userTask.status = "in_progress";
        userTask.claimedAt = null;
        if (userTask.completedAt)
            userTask.completedAt = undefined;
        yield userTask.save();
        yield userTask.populate("task");
        return res.status(200).json({ msg: "UserTask restarted", task: userTask });
    }
    catch (err) {
        console.error("admin_restart_user_task error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_restart_user_task = admin_restart_user_task;
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
// --- Admin: Get all user tasks ---
const admin_get_all_user_tasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const userTasks = yield userTask_1.default.find()
            .populate("user", "name email")
            .populate("task");
        return res.status(200).json({ msg: "success", tasks: userTasks });
    }
    catch (err) {
        console.error("admin_get_all_user_tasks error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_get_all_user_tasks = admin_get_all_user_tasks;
// --- Admin: Force-end a user's task (mark completed) ---
const admin_end_user_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        let userTask = null;
        if (id) {
            userTask = yield userTask_1.default.findById(id);
        }
        else {
            const user = req.query.user || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.user);
            const taskId = req.query.task || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.task);
            if (!user || !taskId)
                return res
                    .status(400)
                    .json({ msg: "id or user and task are required" });
            userTask = yield userTask_1.default.findOne({ user, task: taskId });
        }
        if (!userTask)
            return res.status(404).json({ msg: "UserTask not found" });
        // set progress to goalCount if task known
        const task = yield task_1.default.findById(userTask.task);
        const goal = (_f = (_e = task === null || task === void 0 ? void 0 : task.goalCount) !== null && _e !== void 0 ? _e : userTask.progress) !== null && _f !== void 0 ? _f : 0;
        userTask.progress = goal;
        userTask.status = "completed";
        userTask.completedAt = new Date();
        yield userTask.save();
        yield userTask.populate("task");
        return res
            .status(200)
            .json({ msg: "UserTask marked completed", task: userTask });
    }
    catch (err) {
        console.error("admin_end_user_task error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_end_user_task = admin_end_user_task;
// --- Admin: Delete a user's task record ---
const admin_delete_user_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
        return res.status(403).json({ msg: "admin role required for this action" });
    try {
        const id = String(req.query.id || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.id) || "");
        let deleted = null;
        if (id) {
            deleted = yield userTask_1.default.findByIdAndDelete(id);
        }
        else {
            const user = req.query.user || ((_c = req.body) === null || _c === void 0 ? void 0 : _c.user);
            const taskId = req.query.task || ((_d = req.body) === null || _d === void 0 ? void 0 : _d.task);
            if (!user || !taskId)
                return res
                    .status(400)
                    .json({ msg: "id or user and task are required" });
            deleted = yield userTask_1.default.findOneAndDelete({ user, task: taskId });
        }
        if (!deleted)
            return res.status(404).json({ msg: "UserTask not found" });
        return res.status(200).json({ msg: "UserTask deleted" });
    }
    catch (err) {
        console.error("admin_delete_user_task error:", err);
        return res.status(500).json({ msg: "Server error." });
    }
});
exports.admin_delete_user_task = admin_delete_user_task;
exports.default = {};
