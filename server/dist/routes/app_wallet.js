"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AppWalletRouter = (0, express_1.Router)();
const auth_1 = require("../middleware/auth");
const app_wallet_1 = require("../controllers/app_wallet");
AppWalletRouter.post("/create", auth_1.auth, app_wallet_1.create_app_wallet);
AppWalletRouter.get("/balance", auth_1.auth, app_wallet_1.get_app_wallet);
exports.default = AppWalletRouter;
