"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserRouter = express_1.default.Router();
const user_1 = require("../controllers/user");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
UserRouter.post("/register", user_1.register);
UserRouter.post("/login", user_1.login);
UserRouter.post("/google_auth", user_1.google_auth);
UserRouter.patch("/location", auth_1.auth, user_1.update_location);
UserRouter.patch("/profile_pic", [auth_1.auth, upload_1.upload.single("profile_pic")], user_1.upload_profile_pic);
UserRouter.patch("/remove_pic", auth_1.auth, user_1.remove_profile_pic);
UserRouter.post("/test_push", auth_1.auth, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // lazy import to avoid circular deps
    const { send_test_push } = yield Promise.resolve().then(() => __importStar(require("../controllers/user")));
    return send_test_push(req, res);
}));
UserRouter.patch("/phone", auth_1.auth, user_1.update_phone);
UserRouter.patch("/push_token", auth_1.auth, user_1.set_push_token);
UserRouter.patch("/name", auth_1.auth, user_1.update_name);
UserRouter.patch("/email", auth_1.auth, user_1.update_email);
UserRouter.patch("/password", auth_1.auth, user_1.update_password);
UserRouter.patch("/driver_application", auth_1.auth, user_1.update_driver_application);
UserRouter.get("/data", auth_1.auth, user_1.get_user_data);
exports.default = UserRouter;
