import { Request, Response } from "express";
import fs from "fs";
import Feedback from "../models/feedback";
import { uploadToCloudinary } from "../utils/upload_file";

// Submit feedback (authenticated users only)
export const add_feedback = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const { type, message, images, contact, metadata } = req.body;

    // If multer attached files, upload them to cloudinary and collect URLs
    let uploadedImageUrls: string[] = [];
    const files: any = (req as any).files;
    if (files && Array.isArray(files) && files.length) {
      const uploads = await Promise.all(
        files.map(async (f: any) => {
          try {
            const resu = await uploadToCloudinary(f.path, "feedback");
            // delete local file
            try {
              fs.unlinkSync(f.path);
            } catch (e) {
              /* ignore */
            }
            return resu?.secure_url || null;
          } catch (e) {
            console.error("Failed to upload feedback image:", e);
            return null;
          }
        })
      );
      uploadedImageUrls = uploads.filter(Boolean) as string[];
    }

    if (!type || !message) {
      res.status(400).json({ msg: "Type and message are required." });
      return;
    }

    const feedback = await Feedback.create({
      user: user_id ? user_id : undefined,
      type,
      message,
      images: uploadedImageUrls.length ? uploadedImageUrls : images || [],
      contact,
      metadata: metadata || {},
    });

    res.status(201).json({ msg: "Feedback submitted successfully.", feedback });
  } catch (err: any) {
    console.error(err);
    res
      .status(500)
      .json({ msg: "Failed to submit feedback.", err: err.message });
  }
};

// Get feedbacks submitted by the authenticated user
export const get_user_feedbacks = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const feedbacks = await Feedback.find({ user: user_id }).sort({
      createdAt: -1,
    });
    res
      .status(200)
      .json({ msg: "success", rowCount: feedbacks.length, feedbacks });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// (Optional) Get all feedbacks for admin/audit
export const get_all_feedbacks = async (req: Request, res: Response) => {
  // Admin-only paginated listing
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const { type, user, search, dateFrom, dateTo } = req.query as any;

    const filter: any = {};
    if (type) filter.type = type;
    if (user) filter.user = user;

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

    // Get all feedbacks with populated data for search
    let feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .populate("user", "name email phone");

    // Apply search filter if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      feedbacks = feedbacks.filter((feedback: any) => {
        const id = feedback._id.toString().toLowerCase();
        const userName = (feedback.user?.name || "").toLowerCase();
        const userEmail = (feedback.user?.email || "").toLowerCase();
        const message = (feedback.message || "").toLowerCase();
        const feedbackType = (feedback.type || "").toLowerCase();
        const contact = (feedback.contact || "").toLowerCase();

        return (
          id.includes(searchLower) ||
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          message.includes(searchLower) ||
          feedbackType.includes(searchLower) ||
          contact.includes(searchLower)
        );
      });
    }

    // Get total count and apply pagination
    const total = feedbacks.length;
    const paginatedFeedbacks = feedbacks.slice(skip, skip + limit);

    const pages = Math.ceil(total / limit);
    return res.status(200).json({
      msg: "success",
      feedbacks: paginatedFeedbacks,
      total,
      page,
      pages,
    });
  } catch (err) {
    console.error("get_all_feedbacks error:", err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Admin: delete feedback
export const delete_feedback = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const deleted = await Feedback.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ msg: "Feedback not found" });

    return res.status(200).json({ msg: "Feedback deleted" });
  } catch (err) {
    console.error("delete_feedback error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: get feedback detail
export const get_feedback_detail = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });

    const feedback = await Feedback.findById(id).populate(
      "user",
      "name email phone profile_pic"
    );
    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });

    return res.status(200).json({ msg: "success", feedback });
  } catch (err) {
    console.error("get_feedback_detail error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
