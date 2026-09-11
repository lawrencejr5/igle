import { Types } from "mongoose";
import Wallet, { WalletType } from "../models/wallet";

/**
 * Helper to get or create a specialized Vendor Wallet for a restaurant.
 * Specialized Vendor Wallet uses owner_id: restaurant._id and owner_type: "Vendor".
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
    });
  }

  return wallet;
};
