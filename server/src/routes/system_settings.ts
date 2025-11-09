import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  get_system_settings,
  update_system_settings,
} from "../controllers/systemSettings";

const SystemSettingsRouter = Router();

SystemSettingsRouter.use(auth);

// Public to authenticated: get current system settings
SystemSettingsRouter.get("/", get_system_settings);

// Admin only: update settings
SystemSettingsRouter.patch("/", update_system_settings);

export default SystemSettingsRouter;
