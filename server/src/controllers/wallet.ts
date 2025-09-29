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
import { sendExpoPush } from "../utils/expo_push";
import { get_user_push_tokens, get_driver_push_tokens } from "../utils/get_id";

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
    const txResult = await credit_wallet(reference);

    // Determine wallet owner from the credited transaction
    try {
      const transaction = txResult.transaction as any;
      const walletId = transaction?.wallet_id;
      if (walletId) {
        const wallet = await Wallet.findById(walletId).select(
          "owner_id owner_type"
        );
        if (wallet) {
          const ownerId = wallet.owner_id;
          const ownerType = wallet.owner_type;
          let tokens: string[] = [];
          if (ownerType === "User") {
            tokens = await get_user_push_tokens(ownerId as any);
          } else if (ownerType === "Driver") {
            tokens = await get_driver_push_tokens(ownerId as any);
          }

          if (tokens.length) {
            await sendExpoPush(
              tokens,
              "Wallet funded",
              `Your wallet was credited with ${transaction.amount}`,
              {
                type: "wallet_funded",
                reference: transaction.reference,
              }
            );
          }
        }
      }
    } catch (e) {
      console.error("Failed to send wallet funded push:", e);
    }

    res.status(200).json({ msg: "Wallet funded", transaction: txResult });
  } catch (err: any) {
    console.error(err);
    const msg = err.message || "Verification failed";
    res.status(500).json({ msg });
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
      status: "success",
      amount,
      channel: "bank",
      metadata: {
        for: "driver_withdrawal",
        driver_id: req.user.id,
      },
    });

    // Notify driver about successful withdrawal
    try {
      const tokens = await get_user_push_tokens(req.user?.id);
      if (tokens.length) {
        await sendExpoPush(
          tokens,
          "Withdrawal successful",
          `You have withdrawn ${amount} from your wallet`,
          {
            type: "withdrawal_success",
          }
        );
      }
    } catch (e) {
      console.error("Failed to send withdrawal push:", e);
    }

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
