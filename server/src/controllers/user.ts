import { Request, Response } from "express";

import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { OAuth2Client } from "google-auth-library";

import User, { UserType } from "../models/user";
import user from "../models/user";

const jwt_secret = process.env.JWT_SECRET;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phone }: UserType = req.body;
    if (!name || !email || !password || !phone) {
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
    res
      .status(201)
      .json({ token, user: { id: new_user._id, name, email, phone } });
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
    const { coordinates } = req.body; // [longitude, latitude]

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
