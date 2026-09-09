import { Request, Response } from "express";
import FoodOrder from "../models/foodOrder";
import Basket from "../models/basket";
import Restaurant from "../models/restaurant";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import User from "../models/user";
import { getVendorRestaurant } from "../utils/get_vendor_restaurant";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import { get_user_socket_id, get_user_push_tokens } from "../utils/get_id";
import { sendNotification } from "../utils/expo_push";
import { io } from "../server";
import { agenda } from "../jobs/agenda";

const FLAT_DELIVERY_FEE = 1500; // Flat rate 1500 NGN delivery fee per user requirement

// 1. Place Food Order (Customer)
// POST /api/v1/orders/place
export const place_food_order = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { restaurant_id, delivery_address } = req.body;

    if (!restaurant_id) {
      return res.status(400).json({ msg: "restaurant_id is required to place an order" });
    }

    if (!delivery_address || !delivery_address.address) {
      return res
        .status(400)
        .json({ msg: "Valid delivery address is required" });
    }

    // Fetch user details
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ msg: "User account not found" });
    }

    // Fetch user basket specifically for this restaurant
    const basket = await Basket.findOne({
      user: user_id,
      restaurant: restaurant_id,
    }).populate("items.menu_item");

    if (!basket || !basket.items || basket.items.length === 0) {
      return res
        .status(400)
        .json({ msg: "Your basket for this restaurant is empty. Add items first." });
    }

    // Fetch restaurant
    const restaurant = await Restaurant.findById(basket.restaurant);
    if (!restaurant || restaurant.is_deleted) {
      return res.status(404).json({ msg: "Restaurant no longer exists" });
    }

    if (!restaurant.is_online) {
      return res
        .status(400)
        .json({
          msg: `${restaurant.name} is currently offline and not taking orders.`,
        });
    }

    // Verify item availability
    for (const item of basket.items) {
      const menuItem: any = item.menu_item;
      if (!menuItem || menuItem.is_deleted || !menuItem.is_available) {
        return res.status(400).json({
          msg: `"${menuItem?.name || "An item"}" in your basket is currently unavailable. Please update your basket.`,
        });
      }
    }

    // Calculate Pricing
    const subtotal = basket.subtotal;
    const delivery_fee = FLAT_DELIVERY_FEE;
    const service_fee = 0;
    const total = subtotal + delivery_fee + service_fee;

    // Check In-App Wallet Balance
    let customerWallet = await Wallet.findOne({ owner_id: user_id });
    if (!customerWallet) {
      customerWallet = await Wallet.create({
        owner_id: user_id,
        owner_type: "User",
        balance: 0,
      });
    }

    if (customerWallet.balance < total) {
      return res.status(400).json({
        msg: `Insufficient wallet balance. Total order amount is ₦${total.toLocaleString()}, but your balance is ₦${customerWallet.balance.toLocaleString()}. Please fund your wallet.`,
        code: "INSUFFICIENT_WALLET_BALANCE",
        required_amount: total,
        current_balance: customerWallet.balance,
      });
    }

    // Deduct total from customer's in-app wallet balance
    customerWallet.balance -= total;
    await customerWallet.save();

    const paymentReference = generate_unique_reference();

    // Build item snapshots
    const itemSnapshots = basket.items.map((item: any) => ({
      menu_item_id: item.menu_item._id,
      name: item.menu_item.name,
      image: item.menu_item.image || "",
      price: item.unit_price,
      quantity: item.quantity,
      selected_options: item.selected_options || [],
      special_instructions: item.special_instructions || "",
      item_total: item.item_total,
    }));

    // Generate unique human readable order number (e.g. IGL-98241)
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const order_number = `IGL-${randomNum}`;

    const coordinates: [number, number] =
      delivery_address.coordinates &&
      Array.isArray(delivery_address.coordinates)
        ? [
            Number(delivery_address.coordinates[0]),
            Number(delivery_address.coordinates[1]),
          ]
        : restaurant.location.coordinates.coordinates;

    const order = new FoodOrder({
      order_number,
      customer: user_id,
      restaurant: restaurant._id,
      items: itemSnapshots,
      delivery_address: {
        address: delivery_address.address,
        landmark: delivery_address.landmark || "",
        coordinates,
        contact_name: delivery_address.contact_name || user.name,
        contact_phone: delivery_address.contact_phone || user.phone,
      },
      restaurant_address: {
        name: restaurant.name,
        address: restaurant.location.address,
        coordinates: restaurant.location.coordinates.coordinates,
        phone: restaurant.phone,
      },
      pricing: {
        subtotal,
        delivery_fee,
        service_fee,
        discount: 0,
        total,
        restaurant_earnings: subtotal,
        driver_earnings: delivery_fee,
        platform_commission: service_fee,
      },
      payment: {
        method: "wallet",
        status: "paid",
        transaction_reference: paymentReference,
      },
      status: "placed",
      status_timestamps: {
        placed_at: new Date(),
      },
    });

    await order.save();

    // Create Transaction Record linked to FoodOrder
    await Transaction.create({
      wallet_id: customerWallet._id,
      type: "food_payment",
      amount: total,
      status: "success",
      channel: "wallet",
      reference: paymentReference,
      food_order_id: order._id,
      metadata: {
        restaurant_id: restaurant._id,
        restaurant_name: restaurant.name,
        order_number: order.order_number,
      },
    });

    // Clear ONLY this restaurant's Basket after order placement
    await Basket.findOneAndDelete({ user: user_id, restaurant: restaurant_id });

    // Schedule 3-Minute Vendor Response Timeout Job
    await agenda.schedule("in 3 minutes", "check_food_order_timeout", {
      order_id: order._id,
    });

    // Real-Time Socket Notification to Vendor
    const vendorSocket = await get_user_socket_id(restaurant.user);
    if (vendorSocket) {
      io.to(vendorSocket).emit("new_food_order", {
        order_id: order._id,
        order_number: order.order_number,
        customer_name: user.name,
        total: order.pricing.total,
        items_count: order.items.length,
      });
    }

    // Emit to vendor restaurant socket room
    io.to(`restaurant_${restaurant._id}`).emit("new_food_order", {
      order_id: order._id,
      order_number: order.order_number,
      customer_name: user.name,
      total: order.pricing.total,
    });

    // Expo Push Notification to Vendor User
    const vendorPushTokens = await get_user_push_tokens(restaurant.user);
    if (vendorPushTokens.length > 0) {
      await sendNotification(
        vendorPushTokens,
        "New Food Order! 🍕",
        `New order #${order.order_number} from ${user.name} for ₦${total.toLocaleString()}. Please respond within 3 minutes.`,
        { type: "new_food_order", order_id: String(order._id) },
      );
    }

    return res.status(201).json({
      msg: "Food order placed successfully",
      order,
    });
  } catch (error: any) {
    console.error("place_food_order error:", error);
    return res
      .status(500)
      .json({ msg: "Server error placing food order", error: error.message });
  }
};

// 2. Accept Food Order (Vendor)
// POST /api/v1/orders/:id/accept
export const accept_food_order = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;

    const order = await FoodOrder.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ msg: "Order not found or does not belong to your restaurant" });
    }

    if (order.status !== "placed") {
      return res.status(400).json({
        msg: `Order cannot be accepted because it is currently "${order.status}".`,
      });
    }

    order.status = "preparing";
    order.status_timestamps.preparing_at = new Date();
    await order.save();

    // Socket Notification to Customer
    const customerSocket = await get_user_socket_id(order.customer);
    if (customerSocket) {
      io.to(customerSocket).emit("food_order_updated", {
        order_id: order._id,
        order_number: order.order_number,
        status: "preparing",
        msg: "Your food order has been accepted and is now being prepared! 🍳",
      });
    }

    // Emit to tracking room
    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      status: "preparing",
      msg: "Order accepted by restaurant",
    });

    // Push notification to Customer
    const customerPushTokens = await get_user_push_tokens(order.customer);
    if (customerPushTokens.length > 0) {
      await sendNotification(
        customerPushTokens,
        "Order Accepted! 🍳",
        `${restaurant.name} has accepted your order #${order.order_number} and started preparing it!`,
        { type: "food_order_accepted", order_id: String(order._id) },
      );
    }

    return res.status(200).json({
      msg: "Food order accepted",
      order,
    });
  } catch (error: any) {
    console.error("accept_food_order error:", error);
    return res
      .status(500)
      .json({ msg: "Server error accepting food order", error: error.message });
  }
};

// 3. Reject Food Order (Vendor)
// POST /api/v1/orders/:id/reject
export const reject_food_order = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;
    const { reason } = req.body;

    const order = await FoodOrder.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ msg: "Order not found or does not belong to your restaurant" });
    }

    if (order.status !== "placed") {
      return res.status(400).json({
        msg: `Order cannot be rejected because it is currently "${order.status}".`,
      });
    }

    order.status = "rejected";
    order.cancellation = {
      cancelled_by: "restaurant",
      reason: reason || "Declined by restaurant vendor",
    };
    order.status_timestamps.cancelled_at = new Date();
    await order.save();

    // Refund customer's in-app wallet
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
          reason: "Vendor order rejection refund",
        },
      });
    }

    // Socket notification to Customer
    const customerSocket = await get_user_socket_id(order.customer);
    if (customerSocket) {
      io.to(customerSocket).emit("food_order_updated", {
        order_id: order._id,
        order_number: order.order_number,
        status: "rejected",
        msg: "Your food order was declined by the restaurant. Your money has been refunded to your wallet.",
      });
    }

    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      status: "rejected",
      msg: "Order declined by restaurant",
    });

    // Push notification to Customer
    const customerPushTokens = await get_user_push_tokens(order.customer);
    if (customerPushTokens.length > 0) {
      await sendNotification(
        customerPushTokens,
        "Order Declined 💳",
        `Your order #${order.order_number} was declined. ₦${order.pricing.total.toLocaleString()} has been refunded to your wallet.`,
        { type: "food_order_rejected", order_id: String(order._id) },
      );
    }

    return res.status(200).json({
      msg: "Food order rejected and customer refunded",
      order,
    });
  } catch (error: any) {
    console.error("reject_food_order error:", error);
    return res
      .status(500)
      .json({ msg: "Server error rejecting food order", error: error.message });
  }
};

// 4. Mark Food Ready for Pickup (Vendor)
// POST /api/v1/orders/:id/ready
export const mark_order_ready = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;

    const order = await FoodOrder.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!order) {
      return res
        .status(404)
        .json({ msg: "Order not found or does not belong to your restaurant" });
    }

    if (order.status !== "preparing") {
      return res.status(400).json({
        msg: `Order cannot be marked ready because its status is "${order.status}".`,
      });
    }

    order.status = "ready_for_pickup";
    order.status_timestamps.ready_at = new Date();
    await order.save();

    // Socket notification to customer
    const customerSocket = await get_user_socket_id(order.customer);
    if (customerSocket) {
      io.to(customerSocket).emit("food_order_updated", {
        order_id: order._id,
        order_number: order.order_number,
        status: "ready_for_pickup",
        msg: "Your food order is ready! A delivery rider will pick it up shortly.",
      });
    }

    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      status: "ready_for_pickup",
      msg: "Order is ready for pickup",
    });

    return res.status(200).json({
      msg: "Food order marked as ready for pickup",
      order,
    });
  } catch (error: any) {
    console.error("mark_order_ready error:", error);
    return res
      .status(500)
      .json({
        msg: "Server error updating order status",
        error: error.message,
      });
  }
};

// 5. Cancel Food Order (Customer)
// POST /api/v1/orders/:id/cancel
export const cancel_food_order = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const order = await FoodOrder.findOne({
      _id: id,
      customer: user_id,
    });

    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    const nonCancellableStatuses = ["in_transit", "delivered", "cancelled", "rejected"];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        msg: `Order cannot be cancelled once it is in transit, delivered, or already closed (current status: ${order.status}).`,
      });
    }

    order.status = "cancelled";
    order.cancellation = {
      cancelled_by: "customer",
      reason: reason || "Cancelled by customer",
    };
    order.status_timestamps.cancelled_at = new Date();
    await order.save();

    // Refund customer's in-app wallet balance
    const customerWallet = await Wallet.findOne({ owner_id: user_id });
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
          reason: "Customer order cancellation refund",
        },
      });
    }

    // Socket notification to vendor
    const restaurant = await Restaurant.findById(order.restaurant);
    if (restaurant?.user) {
      const vendorSocket = await get_user_socket_id(restaurant.user);
      if (vendorSocket) {
        io.to(vendorSocket).emit("food_order_cancelled", {
          order_id: order._id,
          order_number: order.order_number,
          msg: "Order was cancelled by the customer.",
        });
      }
    }

    return res.status(200).json({
      msg: "Food order cancelled and wallet refunded",
      order,
    });
  } catch (error: any) {
    console.error("cancel_food_order error:", error);
    return res
      .status(500)
      .json({
        msg: "Server error cancelling food order",
        error: error.message,
      });
  }
};

// 6. Get Customer Orders
// GET /api/v1/orders/customer
export const get_customer_orders = async (req: Request, res: Response) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ msg: "User not authenticated" });
    }

    const orders = await FoodOrder.find({ customer: user_id })
      .populate("restaurant", "name logo phone location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error("get_customer_orders error:", error);
    return res
      .status(500)
      .json({
        msg: "Server error fetching customer orders",
        error: error.message,
      });
  }
};

// 7. Get Vendor Orders
// GET /api/v1/orders/vendor
export const get_vendor_orders = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const orders = await FoodOrder.find({ restaurant: restaurant._id })
      .populate("customer", "name phone profile_pic")
      .sort({ createdAt: -1 });

    return res.status(200).json({ orders });
  } catch (error: any) {
    console.error("get_vendor_orders error:", error);
    return res
      .status(500)
      .json({
        msg: "Server error fetching vendor orders",
        error: error.message,
      });
  }
};

// 8. Get Order Details
// GET /api/v1/orders/:id
export const get_order_by_id = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await FoodOrder.findById(id)
      .populate("customer", "name phone profile_pic")
      .populate("restaurant", "name logo phone location category_tags");

    if (!order) {
      return res.status(404).json({ msg: "Order not found" });
    }

    return res.status(200).json({ order });
  } catch (error: any) {
    console.error("get_order_by_id error:", error);
    return res
      .status(500)
      .json({
        msg: "Server error fetching order details",
        error: error.message,
      });
  }
};
