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
exports.delete_task = exports.update_task = exports.create_task = exports.get_task = exports.get_tasks = void 0;
const task_1 = __importDefault(require("../models/task"));
// List tasks (supports pagination, search, and filters)
const get_tasks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { active, type, search, dateFrom, dateTo, page = 1, limit = 10, } = req.query;
        const queries = {};
        // Active filter
        if (active !== undefined)
            queries.active = active === "true";
        // Type filter
        if (type)
            queries.type = type;
        // Date range filter
        if (dateFrom || dateTo) {
            queries.createdAt = {};
            if (dateFrom)
                queries.createdAt.$gte = new Date(dateFrom);
            if (dateTo)
                queries.createdAt.$lte = new Date(dateTo);
        }
        // Search filter (search across title, description, type)
        if (search) {
            const searchRegex = new RegExp(search, "i");
            queries.$or = [
                { title: searchRegex },
                { description: searchRegex },
                { type: searchRegex },
            ];
        }
        // Pagination
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const [tasks, total] = yield Promise.all([
            task_1.default.find(queries).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
            task_1.default.countDocuments(queries),
        ]);
        const pages = Math.ceil(total / limitNum);
        res.status(200).json({
            msg: "success",
            tasks,
            total,
            page: pageNum,
            pages,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_tasks = get_tasks;
const get_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const task = yield task_1.default.findById(id);
        if (!task)
            return res.status(404).json({ msg: "Task not found" });
        res.status(200).json({ msg: "success", task });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.get_task = get_task;
const create_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
            return res
                .status(403)
                .json({ msg: "admin role required for this action" });
        const { title, description, type, goalCount, rewardAmount, active, startAt, endAt, terms, maxPerUser, totalBudget, } = req.body;
        if (!title || goalCount === undefined || rewardAmount === undefined) {
            return res
                .status(400)
                .json({ msg: "title, goalCount and rewardAmount are required" });
        }
        const task = yield task_1.default.create({
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: err.message || "Server error" });
    }
});
exports.create_task = create_task;
const update_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
            return res
                .status(403)
                .json({ msg: "admin role required for this action" });
        const { id } = req.params;
        const payload = req.body;
        const task = yield task_1.default.findByIdAndUpdate(id, payload, { new: true });
        if (!task)
            return res.status(404).json({ msg: "Task not found" });
        res.status(200).json({ msg: "Task updated", task });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.update_task = update_task;
const delete_task = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
            return res
                .status(403)
                .json({ msg: "admin role required for this action" });
        const { id } = req.params;
        const task = yield task_1.default.findByIdAndDelete(id);
        if (!task)
            return res.status(404).json({ msg: "Task not found" });
        res.status(200).json({ msg: "Task deleted" });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server error." });
    }
});
exports.delete_task = delete_task;
exports.default = {};
