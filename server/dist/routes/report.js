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
// list reports (basic) - consider protecting to admins only in future
ReportRouter.get("/", report_1.get_reports);
exports.default = ReportRouter;
