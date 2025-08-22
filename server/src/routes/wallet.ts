import { Router } from "express";
const WalletRouter = Router();

import { auth } from "../middleware/auth";
import {
  create_wallet,
  fund_wallet,
  get_wallet_balance,
  paystack_redirect,
  request_withdrawal,
  verify_payment,
} from "../controllers/wallet";

// WalletRouter.use(auth);
WalletRouter.get("/redirect", paystack_redirect);
WalletRouter.get("/balance", auth, get_wallet_balance);
WalletRouter.post("/fund", auth, fund_wallet);
WalletRouter.post("/verify", auth, verify_payment);
WalletRouter.post("/create", auth, create_wallet);
WalletRouter.post("/withdraw", auth, request_withdrawal);

export default WalletRouter;
