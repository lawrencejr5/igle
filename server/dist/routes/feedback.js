"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const feedback_1 = require("../controllers/feedback");
const FeedbackRouter = (0, express_1.Router)();
FeedbackRouter.use(auth_1.auth);
FeedbackRouter.post("/", upload_1.upload.array("images", 4), feedback_1.add_feedback);
FeedbackRouter.get("/", feedback_1.get_user_feedbacks);
// Admin feedback management
FeedbackRouter.get("/admin/feedbacks", feedback_1.get_all_feedbacks);
FeedbackRouter.get("/admin/feedbacks/data", feedback_1.get_feedback_detail);
FeedbackRouter.delete("/admin/feedbacks", feedback_1.delete_feedback);
exports.default = FeedbackRouter;
