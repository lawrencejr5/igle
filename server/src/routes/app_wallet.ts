import { Router } from "express";
const AppWalletRouter = Router();

import { auth } from "../middleware/auth";
import { create_app_wallet, get_app_wallet } from "../controllers/app_wallet";

AppWalletRouter.post("/create", auth, create_app_wallet);
AppWalletRouter.get("/balance", auth, get_app_wallet);

export default AppWalletRouter;
