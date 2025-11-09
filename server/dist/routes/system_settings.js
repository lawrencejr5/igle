"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const systemSettings_1 = require("../controllers/systemSettings");
const SystemSettingsRouter = (0, express_1.Router)();
SystemSettingsRouter.use(auth_1.auth);
// Public to authenticated: get current system settings
SystemSettingsRouter.get("/", systemSettings_1.get_system_settings);
// Admin only: update settings
SystemSettingsRouter.patch("/", systemSettings_1.update_system_settings);
exports.default = SystemSettingsRouter;
