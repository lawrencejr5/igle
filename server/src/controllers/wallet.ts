import { Request, Response } from "express";
import { Types } from "mongoose";

import Wallet from "../models/wallet";
import User from "../models/user";
import Transaction from "../models/transaction";

import { credit_wallet } from "../utils/wallet";
import { get_driver_id } from "../utils/get_driver";
import { generate_unique_reference } from "../utils/gen_unique_ref";

import {
  initialize_paystack_transaction,
  verify_paystack_transaction,
} from "../utils/paystack";

export const fund_wallet = async (req: Request, res: Response) => {
  try {
    const { amount, channel } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ msg: "Invalid amount" });
    }

    const owner_id = req.user?.id;

    const user = await User.findById(owner_id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    const wallet = await Wallet.findOne({ owner_id });
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });

    const reference = generate_unique_reference();

    const init = await initialize_paystack_transaction({
      email: user.email,
      amount,
      reference,
    });

    await Transaction.create({
      wallet_id: wallet._id,
      type: "funding",
      amount,
      status: "pending",
      channel,
      reference,
      metadata: { from: "paystack" },
    });

    res.status(200).json({
      msg: "Payment link generated",
      authorization_url: init.authorization_url,
      reference: init.reference,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Failed to initialize transaction" });
  }
};

export const verify_payment = async (req: any, res: any) => {
  try {
    const { reference } = req.query;

    const result = await verify_paystack_transaction(reference);

    if (result.status !== "success") {
      return res.status(400).json({ msg: "Payment not successful" });
    }

    // Credit the user’s wallet
    const tx = await credit_wallet(reference);

    res.status(200).json({ msg: "Wallet funded", transaction: tx });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Verification failed" });
  }
};

export const get_wallet_balance = async (req: any, res: any) => {
  try {
    const { owner_type } = req.query;

    let owner_id;
    if (owner_type === "User") {
      owner_id = req.user?.id;
    } else if (owner_type === "Driver") {
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
