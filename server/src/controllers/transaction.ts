import { Request, Response } from "express";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import { get_driver_id } from "../utils/get_id";
import Driver from "../models/driver";
import axios from "axios";

// Helper function to get start of day/week in UTC
const getDateRanges = () => {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  // Get start of week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  return { startOfToday, startOfWeek };
};

export const get_user_transactions = async (req: Request, res: Response) => {
  try {
    const owner_id = req.user?.id;
    const wallet = await Wallet.findOne({ owner_id });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const { limit = 20, skip = 0, type, status } = req.query;

    // Build query
    const query: any = { wallet_id: wallet._id };
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate("ride_id");

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      msg: "success",
      transactions,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch transactions", error });
  }
};

export const get_driver_transactions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const wallet = await Wallet.findOne({
      owner_id: driver_id,
      owner_type: "Driver",
    });

    if (!wallet) {
      res.status(404).json({ msg: "Driver wallet not found." });
      return;
    }

    const { limit = 20, skip = 0, type, status } = req.query;

    // Build query
    const query: any = { wallet_id: wallet._id };
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(skip))
      .populate("ride_id");

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      msg: "success",
      transactions,
      pagination: {
        total,
        limit: Number(limit),
        skip: Number(skip),
        hasMore: total > Number(skip) + Number(limit),
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ msg: "Could not fetch driver transactions", error: err });
  }
};

export const initiate_driver_withdrawal = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ msg: "Invalid withdrawal amount" });
      return;
    }

    // Get driver details including bank info
    const driver_id = await get_driver_id(req.user?.id!);
    const driver = await Driver.findById(driver_id);

    if (!driver) {
      res.status(404).json({ msg: "Driver not found" });
      return;
    }

    if (!driver.bank?.recipient_code) {
      res.status(400).json({
        msg: "No bank account found. Please add your bank details first.",
      });
      return;
    }

    // Get driver's wallet
    const wallet = await Wallet.findOne({
      owner_id: driver_id,
      owner_type: "Driver",
    });

    if (!wallet) {
      res.status(404).json({ msg: "Wallet not found" });
      return;
    }

    // Check if balance is sufficient
    if (wallet.balance < amount) {
      res.status(400).json({ msg: "Insufficient balance" });
      return;
    }

    // Generate a unique reference
    const reference = `IGLE_WD_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    try {
      // Initiate transfer with Paystack
      const { data } = await axios.post(
        "https://api.paystack.co/transfer",
        {
          source: "balance",
          amount: amount * 100, // Paystack expects amount in kobo
          recipient: driver.bank.recipient_code,
          reason: `IGLE Driver Withdrawal - ${driver.user}`,
          reference,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );

      // Create transaction record
      const transaction = await Transaction.create({
        wallet_id: wallet._id,
        type: "payout",
        amount,
        status: "pending",
        channel: "transfer",
        reference,
        metadata: {
          driver_id,
          transfer_code: data.data.transfer_code,
          recipient_code: driver.bank.recipient_code,
          bank_name: driver.bank.bank_name,
          account_number: driver.bank.account_number,
        },
      });

      // Deduct from wallet balance
      wallet.balance -= amount;
      await wallet.save();

      res.status(200).json({
        msg: "Withdrawal initiated successfully",
        transaction,
        transfer_details: data.data,
      });
    } catch (paystackError: any) {
      console.error(
        "Paystack Error:",
        paystackError?.response?.data || paystackError
      );
      res.status(500).json({
        msg: "Failed to initiate transfer",
        error:
          paystackError?.response?.data?.message || "Paystack transfer failed",
      });
    }
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ msg: "Could not process withdrawal", error: err });
  }
};

export const get_driver_earnings_stats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const driver_id = await get_driver_id(req.user?.id!);
    const wallet = await Wallet.findOne({
      owner_id: driver_id,
      owner_type: "Driver",
    });

    if (!wallet) {
      res.status(404).json({ msg: "Driver wallet not found." });
      return;
    }

    const { startOfToday, startOfWeek } = getDateRanges();

    // Get total completed rides
    const totalTrips = await Transaction.countDocuments({
      wallet_id: wallet._id,
      type: "payment",
      status: "success",
    });

    // Get today's earnings
    const todayEarnings = await Transaction.aggregate([
      {
        $match: {
          wallet_id: wallet._id,
          type: "payment",
          status: "success",
          createdAt: { $gte: startOfToday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Get this week's earnings
    const weekEarnings = await Transaction.aggregate([
      {
        $match: {
          wallet_id: wallet._id,
          type: "payment",
          status: "success",
          createdAt: { $gte: startOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      msg: "success",
      stats: {
        totalTrips,
        todayEarnings: todayEarnings[0]?.total || 0,
        weekEarnings: weekEarnings[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Could not fetch earnings stats", error: err });
  }
};
