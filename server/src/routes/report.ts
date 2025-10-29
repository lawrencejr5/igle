import { Router } from "express";
import { auth } from "../middleware/auth";
import { create_report, get_reports } from "../controllers/report";

const ReportRouter = Router();

// require authentication for submitting reports
ReportRouter.use(auth);

// submit a new report
ReportRouter.post("/", create_report);

// list reports (basic) - consider protecting to admins only in future
ReportRouter.get("/", get_reports);

export default ReportRouter;
