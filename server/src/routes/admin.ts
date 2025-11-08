import express from "express";
const AdminRouter = express.Router();

import {
  register,
  login,
  get_admin_data,
  update_profile,
  update_password,
  upload_profile_pic,
  remove_profile_pic,
  summary,
} from "../controllers/admin";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

AdminRouter.post("/register", register);
AdminRouter.post("/login", login);

AdminRouter.get("/data", auth, get_admin_data);
AdminRouter.patch("/profile", auth, update_profile);
AdminRouter.patch("/password", auth, update_password);
AdminRouter.patch(
  "/profile_pic",
  [auth, upload.single("profile_pic")],
  upload_profile_pic
);
AdminRouter.patch("/remove_pic", auth, remove_profile_pic);
AdminRouter.get("/summary", auth, summary);

export default AdminRouter;
