import { Request, Response } from "express";
import SystemSetting from "../models/systemSetting";

// Get system settings (create defaults if missing)
export const get_system_settings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSetting.findOne();
    if (!settings) {
      settings = await SystemSetting.create({
        rideFare: {
          baseFare: 500,
          costPerKm: 150,
          costPerMinute: 50,
          minimumFare: 800,
          commissionRate: 15,
          cancellationFee: 300,
        },
        deliveryFare: {
          baseDeliveryFee: 600,
          costPerKm: 100,
          weightBasedFee: 200,
          minimumDeliveryFee: 1000,
        },
      });
    }
    return res.status(200).json({ msg: "success", settings });
  } catch (err) {
    console.error("get_system_settings error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// Update settings (admin only)
export const update_system_settings = async (req: Request, res: Response) => {
  if ((req.user as any)?.role !== "admin")
    return res.status(403).json({ msg: "admin role required for this action" });

  try {
    const payload = req.body || {};
    const update: any = {};
    if (payload.rideFare) update.rideFare = payload.rideFare;
    if (payload.deliveryFare) update.deliveryFare = payload.deliveryFare;

    const settings = await SystemSetting.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    return res.status(200).json({ msg: "Settings updated", settings });
  } catch (err) {
    console.error("update_system_settings error:", err);
    return res.status(500).json({ msg: "Server error." });
  }
};

export default {};
