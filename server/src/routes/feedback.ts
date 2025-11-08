import { Router } from "express";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

import {
  add_feedback,
  get_user_feedbacks,
  get_all_feedbacks,
  delete_feedback,
  get_feedback_detail,
} from "../controllers/feedback";

const FeedbackRouter = Router();

FeedbackRouter.use(auth);

FeedbackRouter.post("/", upload.array("images", 4), add_feedback);
FeedbackRouter.get("/", get_user_feedbacks);

// Admin feedback management
FeedbackRouter.get("/admin/feedbacks", get_all_feedbacks);
FeedbackRouter.get("/admin/feedbacks/data", get_feedback_detail);
FeedbackRouter.delete("/admin/feedbacks", delete_feedback);

export default FeedbackRouter;
