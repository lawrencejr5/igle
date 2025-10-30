import { Router } from "express";
const TaskRouter = Router();

import { auth } from "../middleware/auth";
import {
  get_tasks,
  get_task,
  create_task,
  update_task,
  delete_task,
} from "../controllers/task";

// require auth for task management
TaskRouter.use(auth);

TaskRouter.get("/", get_tasks);
TaskRouter.get("/:id", get_task);
TaskRouter.post("/", create_task);
TaskRouter.put("/:id", update_task);
TaskRouter.delete("/:id", delete_task);

export default TaskRouter;
