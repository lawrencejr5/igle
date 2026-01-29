import mongoose from "mongoose";
import crypto from "crypto";

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
      callback_url: `https://igleapi.onrender.com/api/v1/wallet/redirect?reference=${reference}&callback_url=${callback_url}`,
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

export const paystack_webhook = async (req: Request, res: Response) => {
  try {
    // 1. Verify Paystack Signature
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({ msg: "If I slap u!!" });
    }

    const event = req.body;

    if (event.event === "charge.success") {
      const { reference } = event.data;

      await credit_wallet(reference);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err);
    res.sendStatus(500);
  }
};

export const paystack_redirect = (req: Request, res: Response) => {
  const { reference, callback_url } = req.query;

  // Return a tiny HTML page that deep-links back into your app
  res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Redirecting...</title>
      </head>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h2>Redirecting to app...</h2>
        <script>
          // Automatically redirect into the app
          window.location.href = "${callback_url}?reference=${reference}";
        </script>
        <p>If you are not redirected, <a href="igle://paystack-redirect?reference=${reference}">click here</a>.</p>
      </body>
    </html>
  `);
};

export const verify_payment = async (req: any, res: any) => {
  try {
    const { reference } = req.query;

    const result = await verify_paystack_transaction(reference);

    if (result.status !== "success") {
      return res.status(400).json({ msg: "Payment not successful" });
    }

    // Credit the wallet (returns { balance, transaction })
    const transaction_result = await credit_wallet(reference);

    res
      .status(200)
      .json({ msg: "Wallet funded", transaction: transaction_result });
  } catch (err: any) {
    console.error(err);
    const msg = err.message || "Verification failed";
    res.status(500).json({ msg });
  }
};

export const request_withdrawal = async (req: any, res: any) => {
  const session = await mongoose.startSession();
  try {
    const amount = Number(req.body.amount);
    const driver_id = await get_driver_id(req.user?.id);

    // 1. DATABASE WORK FIRST
    const result = await session.withTransaction(async () => {
      const driver = await Driver.findById(driver_id);
      const wallet = await Wallet.findOne({ owner_id: driver_id });

      if (!driver || !wallet) throw new Error("not_found");
      if (!driver.bank?.recipient_code) throw new Error("no_bank_info");
      if (wallet.balance < amount) throw new Error("insufficient");

      // DEDUCT IMMEDIATELY (Safety first)
      wallet.balance -= amount;
      await wallet.save();

      const transaction = await Transaction.create([
        {
          wallet_id: wallet._id,
          type: "payout",
          status: "pending", // ALWAYS start as pending
          amount,
          channel: "bank",
          reference: `WD-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate your own ref first
          metadata: { driver_id: req.user.id },
        },
      ]);

      return {
        transaction: transaction[0],
        recipient: driver.bank.recipient_code,
      };
    });

    // 2. NOW CALL PAYSTACK (Outside the DB transaction)
    try {
      const transfer = await axios.post(
        "https://api.paystack.co/transfer",
        {
          source: "balance",
          amount: amount * 100,
          recipient: result.recipient,
          reason: "Igle Driver Withdrawal",
          reference: result.transaction.reference, // Pass the same ref to Paystack
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        },
      );

      // If we got here, Paystack accepted the request
      return res.json({
        msg: "Withdrawal initiated",
        transfer: transfer.data.data,
      });
    } catch (paystackErr: any) {
      console.error("Paystack API Error:", paystackErr.response?.data);

      return res
        .status(502)
        .json({ msg: "Bank transfer failed. Balance restored." });
    }
  } catch (err: any) {
    res.status(400).json({ msg: err.message });
  } finally {
    session.endSession();
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
  res: Response,
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
