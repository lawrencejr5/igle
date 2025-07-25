import { Request, Response } from "express";
import { Types } from "mongoose";

import Wallet from "../models/wallet";

import { credit_wallet } from "../utils/wallet";
import { get_driver_id } from "../utils/get_driver";
import { generate_unique_reference } from "../utils/gen_unique_ref";

export const get_wallet_balance = async (req: any, res: any) => {
  try {
    const { mode } = req.query;

    let owner_id;
    if (mode === "User") {
      owner_id = req.user?.id;
    } else if (mode === "Driver") {
      owner_id = await get_driver_id(req.user?.id!);
    } else {
      res.status(400).json({ msg: "Owner type is invalid" });
      return;
    }

    const wallet = await Wallet.findOne({ owner_id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({ msg: "success", wallet });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong", err });
  }
};

export const create_wallet = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { owner_type } = req.query;

    if (!owner_type) {
      res.status(400).json({ msg: "Owner type is empty" });
      return;
    }

    let owner_id;
    if (owner_type === "User") {
      owner_id = req.user?.id;
    } else if (owner_type === "Driver") {
      owner_id = await get_driver_id(req.user?.id!);
    } else {
      res.status(400).json({ msg: "Owner type is invalid" });
      return;
    }

    const wallet = await Wallet.create({ owner_id, owner_type, balance: 0 });
    res
      .status(201)
      .json({ msg: `${owner_type} wallet created successfully`, wallet });
  } catch (err) {
    res.status(500).json({ msg: "Server error.", err });
  }
};

export const fund_wallet = async (req: Request, res: Response) => {
  try {
    const { amount, channel } = req.body;
    const owner_id = req.user?.id;
    const wallet = await Wallet.findOne({ owner_id });

    if (!wallet) {
      return res.status(404).json({ msg: "Wallet not found" });
    }

    const transaction = await credit_wallet({
      wallet_id: new Types.ObjectId(wallet._id as string),
      amount,
      type: "funding",
      channel,
      reference: generate_unique_reference(), // You can create a util for this
      metadata: { initiated_by: "user" },
    });

    res.status(200).json({ msg: "Wallet funded successfully", transaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
};
