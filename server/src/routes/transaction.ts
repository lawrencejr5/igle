import { Router } from "express";

const TransactionRouter = Router();

import { auth } from "../middleware/auth";

import { get_user_transactions } from "../controllers/transaction";

TransactionRouter.use(auth);

TransactionRouter.get("/", get_user_transactions);

export default TransactionRouter;
