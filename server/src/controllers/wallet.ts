import { Request, Response } from "express";

import Wallet from "../models/wallet";
import User from "../models/user";
import Transaction from "../models/transaction";
import Driver from "../models/driver";

import { credit_wallet } from "../utils/wallet";
import { get_driver_id } from "../utils/get_id";
import { generate_unique_reference } from "../utils/gen_unique_ref";

import axios from "axios";

import {
  initialize_paystack_transaction,
  verify_paystack_transaction,
} from "../utils/paystack";

export const fund_wallet = async (req: Request, res: Response) => {
  try {
    const { amount, channel, callback_url } = req.body;
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
      callback_url: "igle://paystack-redirect",
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

export const request_withdrawal = async (req: any, res: any) => {
  try {
    const amount = Number(req.body.amount);

    const driver_id = await get_driver_id(req.user?.id);
    const driver = await Driver.findById(driver_id);
    const wallet = await Wallet.findOne({
      owner_id: driver_id,
      owner_type: "Driver",
    });

    if (!driver || !wallet) throw new Error("Driver or wallet not found");

    if (!driver.bank?.recipient_code) {
      return res.status(400).json({ msg: "Bank info not set" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ msg: "Insufficient wallet balance" });
    }

    // Send money to bank using Paystack Transfer
    const transfer = await axios.post(
      "https://api.paystack.co/transfer",
      {
        source: "balance",
        amount: amount * 100, // in kobo
        recipient: driver.bank.recipient_code,
        reason: "Driver withdrawal",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Save transaction
    await Transaction.create({
      wallet_id: wallet._id,
      reference: transfer.data.data.reference,
      type: "payout",
      status: "success", // or "pending" if you want to verify later
      amount,
      channel: "bank",
      metadata: {
        for: "driver_withdrawal",
        driver_id: req.user.id,
      },
    });

    res.json({ msg: "Withdrawal successful", transfer: transfer.data.data });
  } catch (err: any) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ msg: "Withdrawal failed", error: err.message });
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
