import { Request, Response } from "express";
import AppWallet from "../models/app_wallet";

// Create the application wallet (singleton)
export const create_app_wallet = async (req: Request, res: Response) => {
  try {
    // only admins may create the app wallet
    const role = (req.user as any)?.role;
    if (role !== "admin") {
      return res
        .status(403)
        .json({ msg: "admin role required for this action" });
    }
    const existing = await AppWallet.findOne({});
    if (existing) {
      return res
        .status(409)
        .json({ msg: "App wallet already exists", wallet: existing });
    }

    const { balance } = req.body;
    const initialBalance = typeof balance === "number" ? balance : 0;

    const wallet = await AppWallet.create({ balance: initialBalance });
    return res.status(201).json({ msg: "App wallet created", wallet });
  } catch (err) {
    console.error("create_app_wallet error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Get application wallet balance
export const get_app_wallet = async (req: Request, res: Response) => {
  try {
    const role = (req.user as any)?.role;
    if (role !== "admin") {
      return res
        .status(403)
        .json({ msg: "admin role required for this action" });
    }
    const wallet = await AppWallet.findOne({});
    if (!wallet) {
      return res.status(404).json({ msg: "App wallet not found" });
    }
    return res.status(200).json({ msg: "success", wallet });
  } catch (err) {
    console.error("get_app_wallet error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};
