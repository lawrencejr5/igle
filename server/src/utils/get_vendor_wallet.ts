import { Types } from "mongoose";
import Wallet, { WalletType } from "../models/wallet";
import Transaction from "../models/transaction";
import Restaurant from "../models/restaurant";
import { generate_unique_reference } from "./gen_unique_ref";

/**
 * Helper to get or create a specialized Vendor Wallet for a restaurant.
 * Specialized Vendor Wallet uses owner_id: restaurant._id and owner_type: "Restaurant".
 */
export const getOrCreateVendorWallet = async (
  restaurantId: Types.ObjectId | string
): Promise<WalletType> => {
  const rId = new Types.ObjectId(restaurantId as string);

  let wallet = await Wallet.findOne({
    owner_id: rId,
    owner_type: "Restaurant",
  });

  if (!wallet) {
    wallet = await Wallet.create({
      owner_id: rId,
      owner_type: "Restaurant",
      balance: 0,
      pending_balance: 0,
    });
  }

  return wallet;
};

/**
 * Settles a delivered food order: moves earnings from pending_balance to withdrawable balance,
 * and updates transaction status to "success". If no transaction exists, creates a new one.
 */
export const settleVendorOrderEarnings = async (order: any): Promise<boolean> => {
  try {
    if (!order || !order.restaurant) return false;
    const earningsAmount =
      order.pricing?.restaurant_earnings || order.pricing?.subtotal || 0;
    if (earningsAmount <= 0) return true;

    const wallet = await getOrCreateVendorWallet(order.restaurant);

    // Deduct from pending, add to withdrawable balance
    wallet.pending_balance = Math.max(0, (wallet.pending_balance || 0) - earningsAmount);
    wallet.balance = (wallet.balance || 0) + earningsAmount;
    await wallet.save();

    // Try finding existing pending transaction for this food order & vendor wallet
    let txn = await Transaction.findOneAndUpdate(
      {
        food_order_id: new Types.ObjectId(order._id as string),
        wallet_id: wallet._id,
      },
      {
        $set: {
          status: "success",
          type: "vendor_earnings",
          "metadata.status": "delivered",
          "metadata.description": `Earnings for delivered order #${order.order_number}`,
        },
      },
      { new: true }
    );

    if (!txn) {
      txn = await Transaction.findOneAndUpdate(
        {
          food_order_id: order._id,
          wallet_id: wallet._id,
        },
        {
          $set: {
            status: "success",
            type: "vendor_earnings",
            "metadata.status": "delivered",
            "metadata.description": `Earnings for delivered order #${order.order_number}`,
          },
        },
        { new: true }
      );
    }

    // If no existing transaction was found, create a new success transaction record for vendor wallet
    if (!txn) {
      const restaurant = await Restaurant.findById(order.restaurant);
      await Transaction.create({
        wallet_id: wallet._id,
        type: "vendor_earnings",
        amount: earningsAmount,
        status: "success",
        channel: "wallet",
        reference: generate_unique_reference(),
        food_order_id: order._id,
        metadata: {
          order_id: order._id,
          order_number: order.order_number,
          restaurant_id: order.restaurant,
          restaurant_name: restaurant?.name || "Restaurant",
          type: "food_order_earnings",
          status: "delivered",
          description: `Earnings for delivered order #${order.order_number}`,
        },
      });
    }

    return true;
  } catch (err) {
    console.error("settleVendorOrderEarnings error:", err);
    return false;
  }
};

/**
 * Cancels pending earnings for an order if rejected/cancelled before delivery:
 * removes funds from pending_balance and marks transaction status to "failed".
 */
export const cancelVendorOrderPendingEarnings = async (order: any): Promise<boolean> => {
  try {
    if (!order || !order.restaurant) return false;
    const earningsAmount =
      order.pricing?.restaurant_earnings || order.pricing?.subtotal || 0;
    if (earningsAmount <= 0) return true;

    const wallet = await getOrCreateVendorWallet(order.restaurant);

    // Deduct from pending
    wallet.pending_balance = Math.max(0, (wallet.pending_balance || 0) - earningsAmount);
    await wallet.save();

    // Mark transaction as failed/cancelled
    await Transaction.updateMany(
      {
        food_order_id: order._id,
        wallet_id: wallet._id,
      },
      {
        $set: {
          status: "failed",
          "metadata.status": "cancelled",
        },
      }
    );

    return true;
  } catch (err) {
    console.error("cancelVendorOrderPendingEarnings error:", err);
    return false;
  }
};
