import { Request, Response } from "express";
import Restaurant from "../models/restaurant";
import FoodOrder from "../models/foodOrder";
import MenuItem from "../models/menuItem";
import MenuCategory from "../models/menuCategory";
import User from "../models/user";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import {
  settleVendorOrderEarnings,
  cancelVendorOrderPendingEarnings,
} from "../utils/get_vendor_wallet";
import { get_user_push_tokens } from "../utils/get_id";
import { sendNotification } from "../utils/expo_push";

// ─── RESTAURANT ADMIN ────────────────────────────────────────────────────────

// GET /admin/restaurants
export const admin_get_all_restaurants = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { is_deleted: { $ne: true } };

    if (status && status !== "all") {
      filter.application = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const end = new Date(dateTo as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filter)
        .populate("user", "name email phone profile_pic restaurant_application")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Restaurant.countDocuments(filter),
    ]);

    return res.status(200).json({
      restaurants,
      rowCount: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error: any) {
    console.error("admin_get_all_restaurants error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// GET /admin/restaurants/:id
export const admin_get_restaurant_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id).populate(
      "user",
      "name email phone profile_pic restaurant_application is_blocked"
    );

    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    return res.status(200).json({ restaurant });
  } catch (error: any) {
    console.error("admin_get_restaurant_by_id error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// PATCH /admin/restaurants/:id/approve
export const admin_approve_restaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    restaurant.application = "approved";
    restaurant.is_verified = true;
    await restaurant.save();

    await User.findByIdAndUpdate(restaurant.user, {
      restaurant_application: "approved",
      is_restaurant: true,
    });

    // Ensure specialized Restaurant Wallet exists for this restaurant
    const existingVendorWallet = await Wallet.findOne({
      owner_id: restaurant._id,
      owner_type: "Restaurant",
    });

    if (!existingVendorWallet) {
      await Wallet.create({
        owner_id: restaurant._id,
        owner_type: "Restaurant",
        balance: 0,
      });
    }

    // Send push notification to restaurant owner
    if (restaurant.user) {
      try {
        const vendorPushTokens = await get_user_push_tokens(restaurant.user);
        if (vendorPushTokens && vendorPushTokens.length > 0) {
          await sendNotification(
            vendorPushTokens,
            "Restaurant Approved! 🎉",
            `Congratulations! Your restaurant "${restaurant.name}" has been approved. You can now manage your menu and receive orders.`,
            { type: "restaurant_approved", restaurant_id: String(restaurant._id) }
          );
        }
      } catch (pushErr) {
        console.error("Error sending restaurant approval push notification:", pushErr);
      }
    }

    return res.status(200).json({
      msg: "Restaurant approved successfully",
      restaurant,
    });
  } catch (error: any) {
    console.error("admin_approve_restaurant error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// PATCH /admin/restaurants/:id/reject
export const admin_reject_restaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    restaurant.application = "rejected";
    await restaurant.save();

    await User.findByIdAndUpdate(restaurant.user, {
      restaurant_application: "rejected",
    });

    // Send push notification to restaurant owner
    if (restaurant.user) {
      try {
        const vendorPushTokens = await get_user_push_tokens(restaurant.user);
        if (vendorPushTokens && vendorPushTokens.length > 0) {
          await sendNotification(
            vendorPushTokens,
            "Restaurant Application Update",
            `Your restaurant application for "${restaurant.name}" was not approved.${reason ? ` Reason: ${reason}` : ""}`,
            { type: "restaurant_rejected", restaurant_id: String(restaurant._id) }
          );
        }
      } catch (pushErr) {
        console.error("Error sending restaurant rejection push notification:", pushErr);
      }
    }

    return res.status(200).json({
      msg: "Restaurant application rejected",
      reason: reason || "No reason provided",
      restaurant,
    });
  } catch (error: any) {
    console.error("admin_reject_restaurant error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// PATCH /admin/restaurants/:id/block
export const admin_block_restaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).admin?.id;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    const newBlockedState = !restaurant.is_blocked;
    restaurant.is_blocked = newBlockedState;
    restaurant.blocked_at = newBlockedState ? new Date() : undefined;
    restaurant.blocked_by = newBlockedState ? adminId : undefined;
    await restaurant.save();

    return res.status(200).json({
      msg: `Restaurant ${newBlockedState ? "blocked" : "unblocked"} successfully`,
      is_blocked: newBlockedState,
      restaurant,
    });
  } catch (error: any) {
    console.error("admin_block_restaurant error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// DELETE /admin/restaurants/:id
export const admin_delete_restaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = (req as any).admin?.id;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ msg: "Restaurant not found" });
    }

    restaurant.is_deleted = true;
    restaurant.deleted_at = new Date();
    restaurant.deleted_by = adminId;
    await restaurant.save();

    return res.status(200).json({
      msg: "Restaurant deleted successfully",
      restaurant_id: id,
    });
  } catch (error: any) {
    console.error("admin_delete_restaurant error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ─── FOOD ORDER ADMIN ─────────────────────────────────────────────────────────

// GET /admin/food-orders
export const admin_get_all_food_orders = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      dateFrom,
      dateTo,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, parseInt(limit as string, 10));
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom as string);
      if (dateTo) {
        const end = new Date(dateTo as string);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Build base query; handle search separately via $or after populate isn't possible
    // so we filter by order_number directly in DB
    if (search) {
      filter.$or = [
        { order_number: { $regex: search, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      FoodOrder.find(filter)
        .populate("customer", "name phone profile_pic")
        .populate("restaurant", "name logo phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      FoodOrder.countDocuments(filter),
    ]);

    return res.status(200).json({
      orders,
      rowCount: total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
    });
  } catch (error: any) {
    console.error("admin_get_all_food_orders error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// GET /admin/food-orders/:id
export const admin_get_food_order_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await FoodOrder.findById(id)
      .populate("customer", "name phone profile_pic email")
      .populate("restaurant", "name logo phone location category_tags");

    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    return res.status(200).json({ order });
  } catch (error: any) {
    console.error("admin_get_food_order_by_id error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// PATCH /admin/food-orders/:id/status
export const admin_update_food_order_status = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "placed",
      "preparing",
      "ready_for_pickup",
      "in_transit",
      "delivered",
      "cancelled",
      "rejected",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        msg: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
      });
    }

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    order.status = status;

    // Set the relevant timestamp for the new status
    const now = new Date();
    if (status === "preparing") order.status_timestamps.preparing_at = now;
    else if (status === "ready_for_pickup") order.status_timestamps.ready_at = now;
    else if (status === "in_transit") order.status_timestamps.in_transit_at = now;
    else if (status === "delivered") {
      order.status_timestamps.delivered_at = now;
      await settleVendorOrderEarnings(order);
    } else if (status === "cancelled" || status === "rejected") {
      order.status_timestamps.cancelled_at = now;
      await cancelVendorOrderPendingEarnings(order);
    }

    await order.save();

    return res.status(200).json({
      msg: `Food order status updated to "${status}"`,
      order,
    });
  } catch (error: any) {
    console.error("admin_update_food_order_status error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// PATCH /admin/food-orders/:id/cancel
export const admin_cancel_food_order = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    const nonCancellableStatuses = ["delivered", "cancelled", "rejected"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        msg: `Order cannot be cancelled. Current status: ${order.status}`,
      });
    }

    order.status = "cancelled";
    order.cancellation = {
      cancelled_by: "admin",
      reason: reason || "Cancelled by admin",
    };
    order.status_timestamps.cancelled_at = new Date();
    await order.save();

    // Cancel pending vendor earnings if order was accepted
    await cancelVendorOrderPendingEarnings(order);

    // Refund customer wallet
    const customerWallet = await Wallet.findOne({ owner_id: order.customer });
    if (customerWallet) {
      customerWallet.balance += order.pricing.total;
      await customerWallet.save();

      await Transaction.create({
        wallet_id: customerWallet._id,
        type: "payout",
        amount: order.pricing.total,
        status: "success",
        channel: "wallet",
        reference: generate_unique_reference(),
        food_order_id: order._id,
        metadata: {
          order_id: order._id,
          order_number: order.order_number,
          reason: "Admin order cancellation refund",
        },
      });
    }

    return res.status(200).json({
      msg: "Food order cancelled and customer refunded",
      order,
    });
  } catch (error: any) {
    console.error("admin_cancel_food_order error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// DELETE /admin/food-orders/:id
export const admin_delete_food_order = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await FoodOrder.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    return res.status(200).json({
      msg: "Food order deleted successfully",
      order_id: id,
    });
  } catch (error: any) {
    console.error("admin_delete_food_order error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ─── MENU ADMIN ───────────────────────────────────────────────────────────────

// GET /admin/restaurants/:id/menu
export const admin_get_restaurant_menu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [categories, items] = await Promise.all([
      MenuCategory.find({ restaurant: id }).sort({ display_order: 1, createdAt: 1 }),
      MenuItem.find({ restaurant: id, is_deleted: { $ne: true } })
        .populate("category", "name display_order")
        .sort({ display_order: 1, createdAt: -1 }),
    ]);

    return res.status(200).json({ categories, items });
  } catch (error: any) {
    console.error("admin_get_restaurant_menu error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// PATCH /admin/menu-items/:id/toggle
export const admin_toggle_menu_item = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({ _id: id, is_deleted: { $ne: true } });
    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }

    menuItem.is_available = !menuItem.is_available;
    await menuItem.save();

    return res.status(200).json({
      msg: `Menu item is now ${menuItem.is_available ? "Available" : "Unavailable"}`,
      is_available: menuItem.is_available,
      item: menuItem,
    });
  } catch (error: any) {
    console.error("admin_toggle_menu_item error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// DELETE /admin/menu-items/:id
export const admin_delete_menu_item = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findOne({ _id: id, is_deleted: { $ne: true } });
    if (!menuItem) {
      return res.status(404).json({ msg: "Menu item not found" });
    }

    menuItem.is_deleted = true;
    menuItem.deleted_at = new Date();
    menuItem.is_available = false;
    await menuItem.save();

    return res.status(200).json({
      msg: "Menu item deleted successfully",
      item_id: id,
    });
  } catch (error: any) {
    console.error("admin_delete_menu_item error:", error);
    return res.status(500).json({ msg: "Server error", error: error.message });
  }
};
