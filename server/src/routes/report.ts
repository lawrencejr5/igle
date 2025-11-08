import { Router } from "express";
import { auth } from "../middleware/auth";
import {
  create_report,
  get_reports,
  update_report_status,
  delete_report,
  get_report_detail,
} from "../controllers/report";

const ReportRouter = Router();

// require authentication for submitting reports
ReportRouter.use(auth);

// submit a new report
ReportRouter.post("/", create_report);

// admin report management
ReportRouter.get("/admin/reports", get_reports);
ReportRouter.get("/admin/reports/data", get_report_detail);
ReportRouter.patch("/admin/reports/status", update_report_status);
ReportRouter.delete("/admin/reports", delete_report);

export default ReportRouter;
