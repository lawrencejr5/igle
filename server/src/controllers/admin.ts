import { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Admin from "../models/admin";
import { cloudinary } from "../middleware/upload";

const jwt_secret = process.env.JWT_SECRET;

// Register a new admin
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ msg: "All fields are required." });
      return;
    }

    const existing = await Admin.findOne({ email });
    if (existing) {
      res.status(409).json({ msg: "Admin already exists." });
      return;
    }

    const hashed = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const admin = await Admin.create({ username, email, password: hashed });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      jwt_secret as string,
      {
        expiresIn: "7d",
      }
    );

    res.status(201).json({
      token,
      admin: { id: admin._id, name: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Login admin
export const login = async (req: Request, res: Response) => {
  try {
    // allow clients to send `identifier` (email or username), or `email`, or `username`
    const { login_id, email, username, password } = req.body;
    const user = login_id || email || username;

    if (!user || !password) {
      res
        .status(400)
        .json({ msg: "Email/username and password are required." });
      return;
    }

    // find by email OR username
    const admin = await Admin.findOne({
      $or: [{ email: user }, { username: user }],
    });
    if (!admin || !admin.password) {
      res.status(401).json({ msg: "Invalid credentials." });
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      res.status(401).json({ msg: "Invalid credentials." });
      return;
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      jwt_secret as string,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      token,
      admin: { id: admin._id, username: admin.username, email: admin.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Get authenticated admin data
export const get_admin_data = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    const admin = await Admin.findById(id).select("-password");
    if (!admin) return res.status(404).json({ msg: "Admin not found." });
    res.status(200).json({ admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Update profile (username/email)
export const update_profile = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    const { username, email } = req.body;
    if (!username && !email) {
      res.status(400).json({ msg: "Nothing to update." });
      return;
    }

    const update: any = {};
    if (username) update.username = username;
    if (email) update.email = email;

    const admin = await Admin.findByIdAndUpdate(id, update, {
      new: true,
    }).select("-password");
    if (!admin) return res.status(404).json({ msg: "Admin not found." });

    res.status(200).json({ msg: "Profile updated.", admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Update password
export const update_password = async (req: Request, res: Response) => {
  try {
    const id = req.user?.id;
    const { old_password, new_password, confirm_password } = req.body;
    if (!old_password || !new_password || !confirm_password) {
      res.status(400).json({ msg: "All password fields are required." });
      return;
    }
    if (new_password !== confirm_password) {
      res.status(400).json({ msg: "New passwords do not match." });
      return;
    }

    const admin = await Admin.findById(id);
    if (!admin || !admin.password)
      return res.status(404).json({ msg: "Admin not found." });

    const isMatch = await bcrypt.compare(old_password, admin.password);
    if (!isMatch)
      return res.status(401).json({ msg: "Old password is incorrect." });

    admin.password = await bcrypt.hash(new_password, await bcrypt.genSalt(10));
    await admin.save();

    res.status(200).json({ msg: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error." });
  }
};

// Upload profile picture
export const upload_profile_pic = async (req: Request, res: Response) => {
  const admin_id = req.user?.id;
  const filePath = req.file?.path;

  try {
    if (!filePath) return res.status(404).json({ msg: "No file was found" });

    const uploadedFile = await cloudinary.uploader.upload(filePath as string, {
      folder: "igle_images/admin_profile",
    });

    const admin = await Admin.findById(admin_id);
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    // remove old pic if exists
    if (admin.profile_pic_public_id) {
      try {
        await cloudinary.uploader.destroy(admin.profile_pic_public_id);
      } catch (err) {
        console.warn("Failed to destroy old admin profile pic", err);
      }
    }

    admin.profile_pic = uploadedFile.url;
    admin.profile_pic_public_id = uploadedFile.public_id;
    await admin.save();

    res.status(201).json({
      msg: "Profile pic has been updated",
      admin: { id: admin._id, profile_pic: admin.profile_pic },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "An error occured" });
  }
};

export const remove_profile_pic = async (req: Request, res: Response) => {
  try {
    const adminId = req.user?.id;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ msg: "Admin not found" });

    if (admin.profile_pic_public_id) {
      try {
        await cloudinary.uploader.destroy(admin.profile_pic_public_id);
      } catch (err) {
        console.warn("Failed to destroy admin profile pic", err);
      }
    }

    admin.profile_pic = null;
    admin.profile_pic_public_id = null;
    await admin.save();

    return res.json({ msg: "Profile pic removed", admin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "An error occured" });
  }
};

export default {};
