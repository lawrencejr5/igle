import { Request, Response } from "express";
import fs from "fs";
import Feedback from "../models/feedback";
import { uploadToCloudinary } from "../utils/upload_file";

// Submit feedback (authenticated users only)
export const add_feedback = async (
  req: Request,
  res: Response
): Promise<void> => {
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
            return resu?.url || null;
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
export const get_user_feedbacks = async (
  req: Request,
  res: Response
): Promise<void> => {
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
export const get_all_feedbacks = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res
      .status(200)
      .json({ msg: "success", rowCount: feedbacks.length, feedbacks });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};
