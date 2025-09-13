import { Request, Response } from "express";

import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { OAuth2Client } from "google-auth-library";

import User, { UserType } from "../models/user";
import Wallet from "../models/wallet";

import { cloudinary } from "../middleware/upload";

const jwt_secret = process.env.JWT_SECRET;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone }: UserType = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ msg: "All fields are required." });
      return;
    }

    const existing_user = await User.findOne({ email });
    if (existing_user) {
      res.status(409).json({ msg: "User already exists." });
      return;
    }

    const hashed_password = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );
    const new_user = await User.create({
      name,
      email,
      phone,
      password: hashed_password,
    });

    const token = jwt.sign({ id: new_user._id }, jwt_secret as string, {
      expiresIn: "1d",
    });

    await Wallet.create({
      owner_id: new_user?._id,
      owner_type: "User",
      balance: 0,
    });

    res.status(201).json({ token, user: { id: new_user._id, name, email } });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: UserType = req.body;
    if (!email || !password) {
      res.status(400).json({ msg: "Email and password are required." });
      return;
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      res.status(401).json({ msg: "Invalid credentials." });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ msg: "Invalid credentials." });
      return;
    }

    const token = jwt.sign({ id: user._id }, jwt_secret as string, {
      expiresIn: "7d",
    });
    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.name,
        email: user.email,
        phone: user.phone,
        is_driver: user.is_driver,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error." });
  }
};

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
export const google_auth = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { tokenId } = req.body;

  try {
    console.log("Token received:", tokenId);
    if (!tokenId) {
      res.status(401).json({ msg: "Token id not provided" });
      return;
    }
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: "Invalid Google token" });
      return;
    }

    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        provider: "google",
        google_id: sub,
      });
    }

    const token = jwt.sign({ id: user._id }, jwt_secret as string, {
      expiresIn: "7d",
    });
    res.status(200).json({ user, token });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      message: "Google sign-in failed",
      error: error.message || error,
    });
  }
};

// Update user location
export const update_location = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { coordinates } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { location: { type: "Point", coordinates } },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    res.status(200).json({ msg: "User location updated successfully", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const get_user_data = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.user?.id;
    const user = await User.findById(id).select("-password");
    res.status(200).json({ msg: "success", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const upload_profile_pic = async (req: Request, res: Response) => {
  const user_id = req.user?.id;
  const filePath = req.file?.path;

  try {
    if (!filePath) return res.status(404).json({ msg: "No file was found" });

    const uploadedFile = await cloudinary.uploader.upload(filePath as string, {
      folder: "igle_images/profile_pic",
    });

    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Remove old profile pic from Cloudinary if it exists
    if (user.profile_pic_public_id) {
      await cloudinary.uploader.destroy(user.profile_pic_public_id);
    }

    user.profile_pic = uploadedFile.url;
    user.profile_pic_public_id = uploadedFile.public_id;

    await user.save();

    res.status(201).json({ msg: "Profile pic has been updated" });
  } catch (err) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const remove_profile_pic = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // assuming you attach user ID from auth middleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.profile_pic) {
      const publicId = user.profile_pic_public_id;
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    user.profile_pic = null;
    user.profile_pic_public_id = null;
    await user.save();

    return res.json({ msg: "Profile pic removed", user });
  } catch (err) {
    res.status(500).json({ msg: "An error occured" });
  }
};

export const update_password = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { old_password, new_password, confirm_password } = req.body;

    if (!old_password || !new_password || !confirm_password) {
      res.status(400).json({ msg: "All password fields are required." });
      return;
    }

    if (new_password !== confirm_password) {
      res.status(400).json({ msg: "New passwords do not match." });
      return;
    }

    const user = await User.findById(user_id);
    if (!user || !user.password) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    const isMatch = await bcrypt.compare(old_password, user.password);
    if (!isMatch) {
      res.status(401).json({ msg: "Old password is incorrect." });
      return;
    }

    const hashed_password = await bcrypt.hash(
      new_password,
      await bcrypt.genSalt(10)
    );
    user.password = hashed_password;
    await user.save();

    res.status(200).json({ msg: "Password updated successfully." });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Update user phone number
export const update_phone = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { phone } = req.body;

    if (!phone) {
      res.status(400).json({ msg: "Phone number is required." });
      return;
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      { phone },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    res.status(200).json({ msg: "Phone number updated successfully.", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const update_name = async (req: Request, res: Response) => {
  const { fullname } = req.query;
  const user_id = req.user?.id;
  try {
    if (!fullname) {
      res.status(400).json({ msg: "Name is required." });
      return;
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      { name: fullname },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    res.status(200).json({ msg: "Fullname updated successfully.", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

export const update_email = async (req: Request, res: Response) => {
  const { email } = req.query;
  const user_id = req.user?.id;
  try {
    if (!email) {
      res.status(400).json({ msg: "Email is required." });
      return;
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      { email },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    res.status(200).json({ msg: "Email updated successfully.", user });
  } catch (err) {
    res.status(500).json({ msg: "Server error." });
  }
};

// Update user driver application status
export const update_driver_application = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user_id = req.user?.id;
    const { driver_application } = req.body;

    if (driver_application === undefined) {
      res.status(400).json({ msg: "Driver application status is required." });
      return;
    }

    const user = await User.findByIdAndUpdate(
      user_id,
      { driver_application },
      { new: true }
    ).select("-password");

    if (!user) {
      res.status(404).json({ msg: "User not found." });
      return;
    }

    res.status(200).json({
      msg: "Driver application status updated successfully.",
      status: user.driver_application,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error." });
  }
};
