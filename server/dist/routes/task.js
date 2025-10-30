"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TaskRouter = (0, express_1.Router)();
const auth_1 = require("../middleware/auth");
const task_1 = require("../controllers/task");
// require auth for task management
TaskRouter.use(auth_1.auth);
TaskRouter.get("/", task_1.get_tasks);
TaskRouter.get("/:id", task_1.get_task);
TaskRouter.post("/", task_1.create_task);
TaskRouter.put("/:id", task_1.update_task);
TaskRouter.delete("/:id", task_1.delete_task);
exports.default = TaskRouter;
