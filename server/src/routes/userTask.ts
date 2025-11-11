import { Router } from "express";
const UserTaskRouter = Router();

import { auth } from "../middleware/auth";
import {
  get_user_tasks,
  get_user_task,
  ensure_user_task,
  update_progress,
  claim_task,
  admin_end_user_task,
  admin_delete_user_task,
  admin_get_all_user_tasks,
} from "../controllers/userTask";

UserTaskRouter.use(auth);

UserTaskRouter.get("/", get_user_tasks);
UserTaskRouter.get("/:taskId", get_user_task);
UserTaskRouter.post("/:taskId/ensure", ensure_user_task);
UserTaskRouter.post("/:taskId/progress", update_progress);
UserTaskRouter.post("/:taskId/claim", claim_task);

// Admin user-task management
UserTaskRouter.get("/admin/all", admin_get_all_user_tasks);
UserTaskRouter.patch("/admin/usertasks/end", admin_end_user_task);
UserTaskRouter.delete("/admin/usertasks", admin_delete_user_task);

export default UserTaskRouter;
