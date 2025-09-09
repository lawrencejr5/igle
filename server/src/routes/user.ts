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
} from "../controllers/user";

import { auth } from "../middleware/auth";

UserRouter.post("/register", register);
UserRouter.post("/login", login);
UserRouter.post("/google_auth", google_auth);

UserRouter.patch("/location", auth, update_location);
UserRouter.patch("/phone", auth, update_phone);
UserRouter.patch("/name", auth, update_name);
UserRouter.patch("/email", auth, update_email);
UserRouter.patch("/password", auth, update_password);
UserRouter.patch("/driver_application", auth, update_driver_application);

UserRouter.get("/data", auth, get_user_data);

export default UserRouter;
