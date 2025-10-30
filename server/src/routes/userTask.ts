import { Router } from "express";
const UserTaskRouter = Router();

import { auth } from "../middleware/auth";
import {
  get_user_tasks,
  get_user_task,
  ensure_user_task,
  update_progress,
  claim_task,
} from "../controllers/userTask";

UserTaskRouter.use(auth);

UserTaskRouter.get("/", get_user_tasks);
UserTaskRouter.get("/:taskId", get_user_task);
UserTaskRouter.post("/:taskId/ensure", ensure_user_task);
UserTaskRouter.post("/:taskId/progress", update_progress);
UserTaskRouter.post("/:taskId/claim", claim_task);

export default UserTaskRouter;
