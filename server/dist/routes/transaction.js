"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransactionRouter = (0, express_1.Router)();
const auth_1 = require("../middleware/auth");
const transaction_1 = require("../controllers/transaction");
TransactionRouter.use(auth_1.auth);
// User transactions
TransactionRouter.get("/user", transaction_1.get_user_transactions);
// Driver transactions
TransactionRouter.get("/driver", transaction_1.get_driver_transactions);
TransactionRouter.post("/driver/withdraw", transaction_1.initiate_driver_withdrawal);
TransactionRouter.get("/driver/earnings-stats", transaction_1.get_driver_earnings_stats);
// Admin transaction management
TransactionRouter.get("/admin/transactions", transaction_1.admin_get_transactions);
TransactionRouter.get("/admin/transactions/data", transaction_1.admin_get_transaction);
exports.default = TransactionRouter;
