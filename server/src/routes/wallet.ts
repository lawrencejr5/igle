import { Router } from "express";
const WalletRouter = Router();

import { auth } from "../middleware/auth";
import {
  create_wallet,
  fund_wallet,
  get_wallet_balance,
  verify_payment,
} from "../controllers/wallet";

WalletRouter.use(auth);

WalletRouter.get("/balance", get_wallet_balance);
WalletRouter.post("/fund", fund_wallet);
WalletRouter.post("/verify", verify_payment);
WalletRouter.post("/create", create_wallet);

export default WalletRouter;
