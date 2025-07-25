import { Router } from "express";
const WalletRouter = Router();

import { auth } from "../middleware/auth";
import {
  create_wallet,
  fund_wallet,
  get_wallet_balance,
} from "../controllers/wallet";

// WalletRouter.use(auth);

WalletRouter.get("/balance", auth, get_wallet_balance);
WalletRouter.post("/fund", auth, fund_wallet);
WalletRouter.post("/create", auth, create_wallet);

export default WalletRouter;
