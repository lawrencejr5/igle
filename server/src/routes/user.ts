import express from "express";
const UserRouter = express.Router();

import {
  register,
  login,
  google_auth,
  update_location,
  get_user_data,
} from "../controllers/user";

import { auth } from "../middleware/auth";

UserRouter.post("/register", register);
UserRouter.post("/login", login);
UserRouter.post("/google_auth", google_auth);

UserRouter.patch("/location", auth, update_location);

UserRouter.get("/data", auth, get_user_data);

export default UserRouter;
