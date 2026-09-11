import { Router } from "express";
const WalletRouter = Router();

import { auth } from "../middleware/auth";
import {
  create_wallet,
  fund_wallet,
  get_wallet_balance,
  initiate_vendor_withdrawal,
  paystack_redirect,
  paystack_webhook,
  request_withdrawal,
  verify_payment,
} from "../controllers/wallet";

// WalletRouter.use(auth);
WalletRouter.get("/redirect", paystack_redirect);
WalletRouter.get("/balance", auth, get_wallet_balance);
WalletRouter.post("/webhook/paystack", paystack_webhook);
WalletRouter.post("/fund", auth, fund_wallet);
WalletRouter.post("/verify", auth, verify_payment);
WalletRouter.post("/create", auth, create_wallet);
WalletRouter.post("/withdraw", auth, request_withdrawal);
WalletRouter.post("/vendor/withdraw", auth, initiate_vendor_withdrawal);

export default WalletRouter;
