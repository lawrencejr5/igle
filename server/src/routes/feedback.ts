import { Router } from "express";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

import {
  add_feedback,
  get_user_feedbacks,
  get_all_feedbacks,
} from "../controllers/feedback";

const FeedbackRouter = Router();

FeedbackRouter.use(auth);

FeedbackRouter.post("/", upload.array("images", 4), add_feedback);
FeedbackRouter.get("/", get_user_feedbacks);

FeedbackRouter.get("/all", get_all_feedbacks);

export default FeedbackRouter;
