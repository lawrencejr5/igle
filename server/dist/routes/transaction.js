"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const TransactionRouter = (0, express_1.Router)();
const auth_1 = require("../middleware/auth");
const transaction_1 = require("../controllers/transaction");
TransactionRouter.use(auth_1.auth);
TransactionRouter.get("/", transaction_1.get_user_transactions);
exports.default = TransactionRouter;
