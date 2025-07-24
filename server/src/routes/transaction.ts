import { Router } from "express";

const TransactionRouter = Router();

import { make_transaction } from "../controllers/transaction";

TransactionRouter.post("/make", make_transaction);

export default TransactionRouter;
