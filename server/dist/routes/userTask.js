"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserTaskRouter = (0, express_1.Router)();
const auth_1 = require("../middleware/auth");
const userTask_1 = require("../controllers/userTask");
UserTaskRouter.use(auth_1.auth);
UserTaskRouter.get("/", userTask_1.get_user_tasks);
UserTaskRouter.get("/:taskId", userTask_1.get_user_task);
UserTaskRouter.post("/:taskId/ensure", userTask_1.ensure_user_task);
UserTaskRouter.post("/:taskId/progress", userTask_1.update_progress);
UserTaskRouter.post("/:taskId/claim", userTask_1.claim_task);
// Admin user-task management
UserTaskRouter.get("/admin/all", userTask_1.admin_get_all_user_tasks);
UserTaskRouter.patch("/admin/usertasks/end", userTask_1.admin_end_user_task);
UserTaskRouter.patch("/admin/usertasks/restart", userTask_1.admin_restart_user_task);
UserTaskRouter.delete("/admin/usertasks", userTask_1.admin_delete_user_task);
exports.default = UserTaskRouter;
