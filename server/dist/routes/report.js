"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const report_1 = require("../controllers/report");
const ReportRouter = (0, express_1.Router)();
// require authentication for submitting reports
ReportRouter.use(auth_1.auth);
// submit a new report
ReportRouter.post("/", report_1.create_report);
// admin report management
ReportRouter.get("/admin/reports", report_1.get_reports);
ReportRouter.get("/admin/reports/data", report_1.get_report_detail);
ReportRouter.patch("/admin/reports/status", report_1.update_report_status);
ReportRouter.delete("/admin/reports", report_1.delete_report);
exports.default = ReportRouter;
