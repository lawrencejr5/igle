"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserRouter = express_1.default.Router();
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
UserRouter.post("/register", user_1.register);
UserRouter.post("/login", user_1.login);
UserRouter.post("/google_auth", user_1.google_auth);
UserRouter.patch("/location", auth_1.auth, user_1.update_location);
UserRouter.patch("/phone", auth_1.auth, user_1.update_phone);
UserRouter.patch("/name", auth_1.auth, user_1.update_name);
UserRouter.patch("/email", auth_1.auth, user_1.update_email);
UserRouter.patch("/driver_application", auth_1.auth, user_1.update_driver_application);
UserRouter.get("/data", auth_1.auth, user_1.get_user_data);
exports.default = UserRouter;
