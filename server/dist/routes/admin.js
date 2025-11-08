"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AdminRouter = express_1.default.Router();
const admin_1 = require("../controllers/admin");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
AdminRouter.post("/register", admin_1.register);
AdminRouter.post("/login", admin_1.login);
AdminRouter.get("/data", auth_1.auth, admin_1.get_admin_data);
AdminRouter.patch("/profile", auth_1.auth, admin_1.update_profile);
AdminRouter.patch("/password", auth_1.auth, admin_1.update_password);
AdminRouter.patch("/profile_pic", [auth_1.auth, upload_1.upload.single("profile_pic")], admin_1.upload_profile_pic);
AdminRouter.patch("/remove_pic", auth_1.auth, admin_1.remove_profile_pic);
AdminRouter.get("/summary", auth_1.auth, admin_1.summary);
exports.default = AdminRouter;
