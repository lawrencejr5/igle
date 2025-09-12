import { Router } from "express";
const ActivityRouter = Router();

import { auth } from "../middleware/auth";
ActivityRouter.use(auth);

import {
  create_activity,
  get_user_activities,
  remove_activity,
} from "../controllers/activity";

ActivityRouter.get("/", get_user_activities);
ActivityRouter.post("/", create_activity);
ActivityRouter.delete("/", remove_activity);

export default ActivityRouter;
