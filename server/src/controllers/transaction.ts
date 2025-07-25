import { Request, Response } from "express";

import Wallet from "../models/wallet";

import Transaction from "../models/transaction";

export const get_user_transactions = async (req: any, res: any) => {
  try {
    const owner_id = req.user?.id;

    const wallet = await Wallet.findOne({ owner_id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const transactions = await Transaction.find({ wallet_id: wallet._id }).sort(
      { createdAt: -1 }
    );

    res
      .status(200)
      .json({ msg: "success", row_count: transactions.length, transactions });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch transactions", error });
  }
};
