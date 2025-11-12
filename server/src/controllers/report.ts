import { Request, Response } from "express";
import Report from "../models/report";

// Create a new report
export const create_report = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { driver_id, ride_id, category, description, anonymous } = req.body;

    if (!driver_id || !category) {
      res.status(400).json({ msg: "driver_id and category are required." });
      return;
    }

    const report = await Report.create({
      reporter: anonymous ? null : user_id || null,
      driver: driver_id,
      ride: ride_id || null,
      category,
      description: description || "",
      anonymous: !!anonymous,
      status: "new",
    });

    res.status(201).json({ msg: "Report submitted.", report });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ msg: "Failed to submit report.", err: err.message });
  }
};

// (Optional) Get reports - for admin/ops (basic implementation)
export const get_reports = async (req: Request, res: Response) => {
  // Admin-only paginated listing
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const { status, category, reporter, search, dateFrom, dateTo } =
      req.query as any;

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (reporter) filter.reporter = reporter;

    // Date range filters
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDate;
      }
    }

    // Get all reports with populated data for search
    let reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("reporter", "name email phone")
      .populate({
        path: "driver",
        select: "user",
        populate: { path: "user", select: "name" },
      });

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      reports = reports.filter((report: any) => {
        const id = report._id.toString().toLowerCase();
        const reporterName = (report.reporter?.name || "").toLowerCase();
        const reporterEmail = (report.reporter?.email || "").toLowerCase();
        const driverName = (report.driver?.user?.name || "").toLowerCase();
        const description = (report.description || "").toLowerCase();
        const reportCategory = (report.category || "").toLowerCase();
        const reportStatus = (report.status || "").toLowerCase();

        return (
          id.includes(searchLower) ||
          reporterName.includes(searchLower) ||
          reporterEmail.includes(searchLower) ||
          driverName.includes(searchLower) ||
          description.includes(searchLower) ||
          reportCategory.includes(searchLower) ||
          reportStatus.includes(searchLower)
        );
      });
    }

    // Get total count and apply pagination
    const total = reports.length;
    const paginatedReports = reports.slice(skip, skip + limit);

    const pages = Math.ceil(total / limit);
    return res
      .status(200)
      .json({ msg: "success", reports: paginatedReports, total, page, pages });
  } catch (err) {
    console.error("get_reports error:", err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Admin: update report status
export const update_report_status = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.body.id || req.query.id || "");
    const { status } = req.body;
    if (!id || !status)
      return res.status(400).json({ msg: "id and status are required" });

    const report = await Report.findByIdAndUpdate(id, { status }, { new: true })
      .populate("reporter", "name email phone")
      .populate("driver", "user");
    if (!report) return res.status(404).json({ msg: "Report not found" });

    return res.status(200).json({ msg: "Report updated", report });
  } catch (err) {
    console.error("update_report_status error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: delete a report
export const delete_report = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.body.id || req.query.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const deleted = await Report.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ msg: "Report not found" });

    return res.status(200).json({ msg: "Report deleted" });
  } catch (err) {
    console.error("delete_report error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: get report detail
export const get_report_detail = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const report = await Report.findById(id)
      .populate("reporter", "name email phone profile_pic")
      .populate("driver", "user")
      .populate("ride", "pickup destination fare");

    if (!report) return res.status(404).json({ msg: "Report not found" });

    return res.status(200).json({ msg: "success", report });
  } catch (err) {
    console.error("get_report_detail error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
