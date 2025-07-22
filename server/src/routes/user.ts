import express from "express";
const UserRouter = express.Router();

import { register, login, google_auth } from "../controllers/user";

UserRouter.post("/register", register);
UserRouter.post("/login", login);
UserRouter.post("/google_auth", google_auth);

export default UserRouter;
