import { Request, Response } from "express";

import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { OAuth2Client } from "google-auth-library";

import User, { UserType } from "../models/user";
import Wallet from "../models/wallet";
import Ride from "../models/ride";
import Delivery from "../models/delivery";
import Transaction from "../models/transaction";
import Driver from "../models/driver";
import SavedPlace from "../models/saved_place";
import Activity from "../models/activity";
import Report from "../models/report";

import { cloudinary } from "../middleware/upload";
import axios from "axios";

const jwt_secret = process.env.JWT_SECRET;

export const register = async (req: Request, res: Response) => {
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

export const login = async (req: Request, res: Response) => {
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
    // prevent login for soft-deleted accounts
    if ((user as any).is_deleted) {
      return res.status(403).json({ msg: "Account has been deleted." });
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

// Heuristic: fetch the image and check if it looks like a real photo.
// Returns true if content-type starts with image/ and size is > 2KB.
const imageLooksLikePhoto = async (url?: string | undefined) => {
  if (!url) return false;
  try {
    const resp = await axios.get(url, { responseType: "arraybuffer" });
    const contentType = resp.headers["content-type"] || "";
    const size = resp.data ? resp.data.byteLength || resp.data.length || 0 : 0;
    // If it's an image and reasonably sized (>2KB), treat as a photo
    return contentType.startsWith("image/") && size > 2048;
  } catch (err) {
    const m = (err as any)?.message || JSON.stringify(err);
    console.warn("imageLooksLikePhoto fetch failed:", m);
    // Be conservative: if we can't fetch, don't set the profile pic to avoid placeholders
    return false;
  }
};

export const google_auth = async (req: Request, res: Response) => {
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

    let user: any = await User.findOne({ email });
    let isNew = false;
    if (!user) {
      isNew = true;
      // create a new user and set profile picture from Google
      const shouldSetPic = await imageLooksLikePhoto(picture);
      user = await User.create({
        name,
        email,
        profile_pic: shouldSetPic ? picture : null,
        provider: "google",
        google_id: sub,
      });
      // create a wallet for the new user (register flow creates a wallet)
      try {
        await Wallet.create({
          owner_id: user._id,
          owner_type: "User",
          balance: 0,
        });
      } catch (walletErr) {
        console.error("Failed to create wallet for google user:", walletErr);
      }
    } else {
      // existing user: if profile_pic is null/empty, set it from Google's picture
      // Do not overwrite an existing custom profile picture.
      if ((!user.profile_pic || user.profile_pic === null) && picture) {
        const shouldSetPic = await imageLooksLikePhoto(picture);
        if (shouldSetPic) user.profile_pic = picture;
      }
      user.google_id = sub || user.google_id;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, jwt_secret as string, {
      expiresIn: "7d",
    });
    res.status(200).json({ user, token, isNew });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    res.status(500).json({
      message: "Google sign-in failed",
      error: error.message || error,
    });
  }
};

// Update user location
export const update_location = async (req: Request, res: Response) => {
  try {
    // prevent blocked users from making changes
    const actingId = req.user?.id;
    const actingUser = await User.findById(actingId).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });

    const id = String(req.query.id || req.body?.id || "");
    const { coordinates } = req.body;

    if (!id) {
      return res.status(400).json({ msg: "id is required" });
    }

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

export const get_user_data = async (req: Request, res: Response) => {
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
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });

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
    const actingUser = await User.findById(userId).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
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

export const update_password = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
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
export const update_phone = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
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
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
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
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
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
) => {
  try {
    const user_id = req.user?.id;
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
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

// Register or remove an Expo push token for the authenticated user
export const set_push_token = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    const actingUser = await User.findById(user_id).select("is_blocked");
    if (actingUser?.is_blocked)
      return res.status(403).json({ msg: "Account is blocked." });
    const { token, action } = req.body; // action: 'add' | 'remove' (default: add)

    if (!token) return res.status(400).json({ msg: "No token provided." });

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ msg: "User not found." });

    // ensure array exists
    if (!Array.isArray(user.expo_push_tokens)) user.expo_push_tokens = [];

    if (action === "remove") {
      user.expo_push_tokens = user.expo_push_tokens.filter((t) => t !== token);
      await user.save();
      return res.json({ msg: "Push token removed." });
    }

    // default: add
    if (!user.expo_push_tokens.includes(token)) {
      user.expo_push_tokens.push(token);
      await user.save();
    }

    return res.json({ msg: "Push token saved." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Send a test push to the authenticated user's registered Expo tokens
export const send_test_push = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ msg: "Unauthorized" });

    const { get_user_push_tokens } = await import("../utils/get_id");
    const { sendExpoPush } = await import("../utils/expo_push");

    const tokens = await get_user_push_tokens(user_id);
    console.log("[test_push] tokens for user", user_id, tokens);

    if (!tokens || tokens.length === 0)
      return res
        .status(400)
        .json({ msg: "No push tokens registered for this user" });

    const result = await sendExpoPush(
      tokens,
      "Test Notification",
      "This is a test push from server",
      { type: "test_push" }
    );

    console.log("[test_push] sendExpoPush result:", result);
    return res.json({ msg: "Test push sent", result });
  } catch (err) {
    console.error("send_test_push error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

// Admin: fetch paginated list of users
export const admin_get_users = async (req: Request, res: Response) => {
  // admin only
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const includeDeleted = req.query.include_deleted === "true";
    const filter: any = {};
    if (!includeDeleted) filter.is_deleted = false;

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    const pages = Math.ceil(total / limit);

    return res.status(200).json({ msg: "success", users, total, page, pages });
  } catch (err) {
    console.error("admin_get_users error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: get user data including counts for rides and deliveries
export const admin_get_user = async (req: Request, res: Response) => {
  // admin only
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    // respect soft-delete: if user is deleted, return 404 unless include_deleted=true
    const includeDeleted = req.query.include_deleted === "true";
    if (user.is_deleted && !includeDeleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    const [numRides, numDeliveries] = await Promise.all([
      Ride.countDocuments({ rider: user._id, status: "completed" }),
      Delivery.countDocuments({ sender: user._id, status: "delivered" }),
    ]);

    return res
      .status(200)
      .json({ msg: "success", user, numRides, numDeliveries });
  } catch (err) {
    console.error("admin_get_user error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: edit user
export const admin_edit_user = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });
    const allowed = [
      "name",
      "email",
      "phone",
      "is_driver",
      "is_verified",
      "driver_application",
    ];
    const update: any = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }

    if (Object.keys(update).length === 0)
      return res.status(400).json({ msg: "Nothing to update" });

    const user = await User.findByIdAndUpdate(id, update, { new: true }).select(
      "-password"
    );
    if (!user) return res.status(404).json({ msg: "User not found" });

    return res.status(200).json({ msg: "User updated", user });
  } catch (err) {
    console.error("admin_edit_user error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: delete user and related data
export const admin_delete_user = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const soft = req.query.soft === "true" || req.body?.soft === true;
    if (soft) {
      // perform soft delete: mark user as deleted and record admin
      user.is_deleted = true as any;
      user.deleted_at = new Date() as any;
      user.deleted_by = req.user?.id as any;
      await user.save();
      return res.status(200).json({ msg: "User soft-deleted" });
    }

    // delete user's wallets and transactions
    const wallets = await Wallet.find({ owner_id: user._id });
    const walletIds = wallets.map((w) => w._id);
    if (walletIds.length) {
      await Transaction.deleteMany({ wallet_id: { $in: walletIds } });
      await Wallet.deleteMany({ _id: { $in: walletIds } });
    }

    // delete rides where user is rider
    await Ride.deleteMany({ rider: user._id });
    // delete deliveries where user is sender
    await Delivery.deleteMany({ sender: user._id });

    // delete saved places and activities and reports by user
    await SavedPlace.deleteMany({ user: user._id });
    await Activity.deleteMany({ user: user._id });
    await Report.deleteMany({ reporter: user._id });

    // if user has a Driver record, remove driver and related data
    const driver = await Driver.findOne({ user: user._id });
    if (driver) {
      // driver wallet and transactions
      const dWallets = await Wallet.find({ owner_id: driver._id });
      const dWalletIds = dWallets.map((w) => w._id);
      if (dWalletIds.length) {
        await Transaction.deleteMany({ wallet_id: { $in: dWalletIds } });
        await Wallet.deleteMany({ _id: { $in: dWalletIds } });
      }

      await Ride.deleteMany({ driver: driver._id });
      await Delivery.deleteMany({ driver: driver._id });
      await Report.deleteMany({ driver: driver._id });
      await Driver.deleteOne({ _id: driver._id });
    }

    // finally delete user
    await User.deleteOne({ _id: user._id });

    return res.status(200).json({ msg: "User and related data deleted" });
  } catch (err) {
    console.error("admin_delete_user error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Admin: block or unblock user
export const admin_block_user = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const id = String(req.query.id || req.body?.id || "");
    if (!id) return res.status(400).json({ msg: "id is required" });
    const block = req.body?.block === true || req.query?.block === "true";

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    if (block) {
      user.is_blocked = true as any;
      user.blocked_at = new Date() as any;
      user.blocked_by = req.user?.id as any;
    } else {
      user.is_blocked = false as any;
      user.blocked_at = null as any;
      user.blocked_by = null as any;
    }

    await user.save();
    return res
      .status(200)
      .json({ msg: block ? "User blocked" : "User unblocked" });
  } catch (err) {
    console.error("admin_block_user error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
