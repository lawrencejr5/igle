import { Router } from "express";
const TransactionRouter = Router();

import { auth } from "../middleware/auth";
import {
  get_user_transactions,
  get_driver_transactions,
  initiate_driver_withdrawal,
  get_driver_earnings_stats,
} from "../controllers/transaction";

TransactionRouter.use(auth);

// User transactions
TransactionRouter.get("/user", get_user_transactions);

// Driver transactions
TransactionRouter.get("/driver", get_driver_transactions);
TransactionRouter.post("/driver/withdraw", initiate_driver_withdrawal);
TransactionRouter.get("/driver/earnings-stats", get_driver_earnings_stats);

export default TransactionRouter;
