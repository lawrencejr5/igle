import { Router } from "express";
const WalletRouter = Router();

import { auth } from "../middleware/auth";
import { create_wallet, fund_wallet } from "../controllers/wallet";

WalletRouter.post("/fund", auth, fund_wallet);
WalletRouter.post("/create", auth, create_wallet);

export default WalletRouter;
