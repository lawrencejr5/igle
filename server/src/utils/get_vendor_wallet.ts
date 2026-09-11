import { Types } from "mongoose";
import Wallet, { WalletType } from "../models/wallet";
import Transaction from "../models/transaction";

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
 * and updates transaction status to "success".
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

    // Mark pending transaction as success
    await Transaction.findOneAndUpdate(
      {
        food_order_id: order._id,
        wallet_id: wallet._id,
      },
      {
        status: "success",
        "metadata.status": "delivered",
      }
    );

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
    await Transaction.findOneAndUpdate(
      {
        food_order_id: order._id,
        wallet_id: wallet._id,
      },
      {
        status: "failed",
        "metadata.status": "cancelled",
      }
    );

    return true;
  } catch (err) {
    console.error("cancelVendorOrderPendingEarnings error:", err);
    return false;
  }
};
