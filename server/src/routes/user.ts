import express from "express";
const UserRouter = express.Router();

import {
  register,
  login,
  google_auth,
  update_location,
  get_user_data,
  update_phone,
  update_name,
  update_email,
  update_password,
  update_driver_application,
  upload_profile_pic,
  remove_profile_pic,
  set_push_token,
} from "../controllers/user";

import { auth } from "../middleware/auth";
import { upload } from "../middleware/upload";

UserRouter.post("/register", register);
UserRouter.post("/login", login);
UserRouter.post("/google_auth", google_auth);

UserRouter.patch("/location", auth, update_location);
UserRouter.patch(
  "/profile_pic",
  [auth, upload.single("profile_pic")],
  upload_profile_pic
);
UserRouter.patch("/remove_pic", auth, remove_profile_pic);
UserRouter.post("/test_push", auth, async (req, res, next) => {
  // lazy import to avoid circular deps
  const { send_test_push } = await import("../controllers/user");
  return send_test_push(req, res as any);
});
UserRouter.patch("/phone", auth, update_phone);
UserRouter.patch("/push_token", auth, set_push_token);
UserRouter.patch("/name", auth, update_name);
UserRouter.patch("/email", auth, update_email);
UserRouter.patch("/password", auth, update_password);
UserRouter.patch("/driver_application", auth, update_driver_application);

UserRouter.get("/data", auth, get_user_data);

export default UserRouter;
