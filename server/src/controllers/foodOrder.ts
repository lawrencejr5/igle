import { Request, Response } from "express";
import FoodOrder from "../models/foodOrder";
import Basket from "../models/basket";
import Restaurant from "../models/restaurant";
import Wallet from "../models/wallet";
import Transaction from "../models/transaction";
import User from "../models/user";
import Delivery from "../models/delivery";
import Driver from "../models/driver";
import { calculate_commission } from "../utils/calc_commision";
import { getVendorRestaurant } from "../utils/get_vendor_restaurant";
import { generate_unique_reference } from "../utils/gen_unique_ref";
import {
  get_user_socket_id,
  get_user_push_tokens,
  get_driver_socket_id,
} from "../utils/get_id";
import { sendNotification } from "../utils/expo_push";
import { io } from "../server";
import { agenda } from "../jobs/agenda";
import { complete_delivery } from "../utils/complete_delivery";

import {
  getOrCreateVendorWallet,
  settleVendorOrderEarnings,
  cancelVendorOrderPendingEarnings,
} from "../utils/get_vendor_wallet";


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

    // 1. Transaction Record for Customer (Money Out / Paid)
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

    // 2. Transaction Record for Restaurant (Pending Earnings including menu price + delivery fee)
    try {
      const vendorWallet = await getOrCreateVendorWallet(restaurant._id as any);
      vendorWallet.pending_balance = (vendorWallet.pending_balance || 0) + total;
      await vendorWallet.save();

      await Transaction.create({
        wallet_id: vendorWallet._id,
        type: "vendor_earnings",
        amount: total,
        status: "pending",
        channel: "wallet",
        reference: generate_unique_reference(),
        food_order_id: order._id,
        metadata: {
          order_id: order._id,
          order_number: order.order_number,
          restaurant_id: restaurant._id,
          type: "food_order_earnings",
          status: "pending",
          description: `Pending earnings for order #${order.order_number}`,
        },
      });
    } catch (vErr) {
      console.error("Error creating restaurant pending wallet balance on place order:", vErr);
    }


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

    // Verify vendor pending wallet balance exists for this order
    try {
      const vendorWallet = await getOrCreateVendorWallet(restaurant._id as any);
      const existingTxn = await Transaction.findOne({
        wallet_id: vendorWallet._id,
        food_order_id: order._id,
      });

      if (!existingTxn) {
        const earningsAmount = order.pricing?.total || 0;
        if (earningsAmount > 0) {
          vendorWallet.pending_balance = (vendorWallet.pending_balance || 0) + earningsAmount;
          await vendorWallet.save();

          await Transaction.create({
            wallet_id: vendorWallet._id,
            type: "vendor_earnings",
            amount: earningsAmount,
            status: "pending",
            channel: "wallet",
            reference: generate_unique_reference(),
            food_order_id: order._id,
            metadata: {
              order_id: order._id,
              order_number: order.order_number,
              restaurant_id: restaurant._id,
              type: "food_order_earnings",
              status: "pending",
              description: `Pending earnings for order #${order.order_number}`,
            },
          });
        }
      }
    } catch (wErr) {
      console.error("Error checking vendor pending balance on order accept:", wErr);
    }

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

    // Cancel pending vendor earnings for this order
    await cancelVendorOrderPendingEarnings(order);

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

// 4. Mark Food Ready for Pickup (Vendor) — dispatches a bike rider delivery
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

    // ─── Dispatch a bike rider delivery ───
    try {
      const commission = calculate_commission(FLAT_DELIVERY_FEE);
      const driver_earnings = FLAT_DELIVERY_FEE - commission;

      // Restaurant location is the pickup; customer address is the dropoff
      const [restLat, restLng] = order.restaurant_address.coordinates;
      const [custLat, custLng] = order.delivery_address.coordinates;

      const new_delivery = await Delivery.create({
        // sender is the restaurant's owner user (keeps Delivery.sender as User ref)
        sender: restaurant.user,
        pickup: {
          address: order.restaurant_address.address,
          coordinates: [restLat, restLng],
        },
        dropoff: {
          address: order.delivery_address.address,
          coordinates: [custLat, custLng],
        },
        to: {
          name: order.delivery_address.contact_name,
          phone: order.delivery_address.contact_phone,
        },
        package: {
          description: `Food delivery — Order #${order.order_number}`,
          type: "food",
          fragile: false,
        },
        vehicle: "bike",
        fare: FLAT_DELIVERY_FEE,
        driver_earnings,
        commission,
        distance_km: 0,   // rider uses in-app navigation
        duration_mins: 0,
        // Auto-paid: customer already paid delivery fee at order placement
        payment_status: "paid",
        payment_method: "wallet",
        status: "pending",
        food_order_id: order._id,
      });

      // Save delivery reference on the food order
      (order as any).delivery_id = new_delivery._id;
      await order.save();

      // Notify all online bike riders via socket
      const bikeDrivers = await Driver.find({
        vehicle_type: "bike",
        is_online: true,
        is_busy: false,
      });

      await Promise.all(
        bikeDrivers.map(async (d: any) => {
          try {
            const driverSocket = await get_driver_socket_id(String(d._id));
            if (driverSocket) {
              io.to(driverSocket).emit("delivery_request", {
                delivery_id: new_delivery._id,
              });
            }
          } catch (e) {
            console.error("Failed to notify bike rider", d._id, e);
          }
        })
      );

      // Expiry timer (30s) — same as normal delivery
      setTimeout(async () => {
        const d = await Delivery.findById(new_delivery._id);
        if (d && d.status === "pending") {
          d.status = "expired" as any;
          await d.save();

          io.emit("delivery_request_expired", {
            delivery_id: new_delivery._id,
            food_order_id: order._id,
            msg: "Food delivery request expired — no rider accepted in time",
          });

          const vendorSocket = await get_user_socket_id(restaurant.user);
          if (vendorSocket) {
            io.to(vendorSocket).emit("food_order_updated", {
              order_id: order._id,
              delivery_id: new_delivery._id,
              delivery_status: "expired",
              msg: "No rider was found for your food order. Click to retry search.",
            });
          }

          io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            delivery_id: new_delivery._id,
            delivery_status: "expired",
            msg: "Rider search timed out",
          });
        }
      }, 30000);

      console.log(
        `Food delivery dispatched: ${new_delivery._id} for order ${order.order_number}`
      );
    } catch (dispatchErr) {
      // Non-fatal: log but don't fail the whole request
      console.error("Failed to dispatch bike delivery for food order:", dispatchErr);
    }
    // ─── End dispatch ───

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
      msg: "Order is ready for pickup — dispatch rider notified",
    });

    return res.status(200).json({
      msg: "Food order marked as ready for pickup. Dispatch rider notified.",
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

// 4b. Mark Food Order as Delivered (Vendor or Driver)
// POST /api/v1/orders/:id/deliver
export const mark_order_delivered = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const order = await FoodOrder.findById(id);
    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    if (["delivered", "cancelled", "rejected"].includes(order.status)) {
      return res.status(400).json({
        msg: `Order cannot be marked delivered because its status is currently "${order.status}".`,
      });
    }

    order.status = "delivered";
    order.status_timestamps.delivered_at = new Date();
    await order.save();

    // Settle vendor earnings: credits restaurant with subtotal only (delivery_fee goes to rider)
    await settleVendorOrderEarnings(order);

    // Complete linked delivery (credit bike rider wallet) if one was dispatched
    if ((order as any).delivery_id) {
      try {
        const linkedDelivery = await Delivery.findById((order as any).delivery_id);
        if (linkedDelivery && linkedDelivery.status === "in_transit") {
          const result = await complete_delivery(linkedDelivery as any);
          if (!result.success) {
            console.error(
              "Failed to complete linked delivery for food order:",
              result.message
            );
          }
        }
      } catch (deliveryErr) {
        console.error("Error completing linked delivery:", deliveryErr);
      }
    }

    // Socket notification to Customer
    const customerSocket = await get_user_socket_id(order.customer);
    if (customerSocket) {
      io.to(customerSocket).emit("food_order_updated", {
        order_id: order._id,
        order_number: order.order_number,
        status: "delivered",
        msg: "Your food order has been delivered! Enjoy your meal 🍔",
      });
    }

    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      status: "delivered",
      msg: "Order delivered successfully",
    });

    return res.status(200).json({
      msg: "Food order marked as delivered and vendor wallet credited",
      order,
    });
  } catch (error: any) {
    console.error("mark_order_delivered error:", error);
    return res
      .status(500)
      .json({
        msg: "Server error marking order delivered",
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

    const nonCancellableStatuses = [
      "preparing",
      "ready_for_pickup",
      "in_transit",
      "delivered",
      "cancelled",
      "rejected",
    ];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({
        msg: `Order cannot be cancelled once it has been accepted by the restaurant (current status: ${order.status}).`,
      });
    }

    order.status = "cancelled";
    order.cancellation = {
      cancelled_by: "customer",
      reason: reason || "Cancelled by customer",
    };
    order.status_timestamps.cancelled_at = new Date();
    await order.save();

    // Cancel vendor pending earnings for this order
    await cancelVendorOrderPendingEarnings(order);

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

// 9. Get Linked Delivery Status for a Food Order
// GET /api/v1/orders/:id/delivery
export const get_food_order_delivery_status = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const order = await FoodOrder.findById(id).select("delivery_id customer");
    if (!order) {
      return res.status(404).json({ msg: "Food order not found" });
    }

    if (!(order as any).delivery_id) {
      return res
        .status(404)
        .json({ msg: "No dispatch delivery linked to this food order yet" });
    }

    const delivery = await Delivery.findById((order as any).delivery_id)
      .populate({
        path: "driver",
        select:
          "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name phone profile_pic",
        },
      });

    return res.status(200).json({ msg: "success", delivery });
  } catch (error: any) {
    console.error("get_food_order_delivery_status error:", error);
    return res.status(500).json({
      msg: "Server error fetching delivery status",
      error: error.message,
    });
  }
};

// 10. Pay Food Delivery Rider (Restaurant Vendor)
// POST /api/v1/orders/:id/pay-delivery
export const pay_food_delivery = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;
    const order = await FoodOrder.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found or does not belong to your restaurant" });
    }

    if (!(order as any).delivery_id) {
      return res.status(404).json({ msg: "No linked delivery found for this order" });
    }

    const delivery = await Delivery.findById((order as any).delivery_id);
    if (!delivery) {
      return res.status(404).json({ msg: "Delivery record not found" });
    }

    if (delivery.payment_status === "paid") {
      return res.status(400).json({ msg: "Delivery fee has already been paid" });
    }

    if (delivery.status !== "arrived") {
      return res.status(400).json({ msg: "Dispatch rider has not arrived yet" });
    }

    // Debit restaurant vendor's wallet
    const vendorWallet = await getOrCreateVendorWallet(restaurant._id as any);
    if ((vendorWallet.balance || 0) < delivery.fare) {
      return res.status(400).json({
        msg: `Insufficient vendor wallet balance (₦${(vendorWallet.balance || 0).toLocaleString()}) to pay delivery fee of ₦${delivery.fare.toLocaleString()}`,
      });
    }

    vendorWallet.balance -= delivery.fare;
    await vendorWallet.save();

    await Transaction.create({
      wallet_id: vendorWallet._id,
      type: "payout",
      amount: delivery.fare,
      status: "success",
      channel: "wallet",
      reference: generate_unique_reference(),
      food_order_id: order._id,
      metadata: {
        order_id: order._id,
        order_number: order.order_number,
        delivery_id: delivery._id,
        type: "rider_delivery_payment",
        description: `Paid ₦${delivery.fare} for rider dispatch on order #${order.order_number}`,
      },
    });

    delivery.payment_status = "paid";
    await delivery.save();

    // Socket Notifications to driver and vendor
    const driverSocket = delivery.driver ? await get_driver_socket_id(delivery.driver.toString()) : null;
    if (driverSocket) {
      io.to(driverSocket).emit("delivery_paid", {
        delivery_id: delivery._id,
        msg: "Restaurant vendor has paid the delivery fee!",
      });
    }

    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      status: order.status,
      payment_status: "paid",
      msg: "Vendor paid delivery fee to rider",
    });

    return res.status(200).json({
      msg: "Delivery fee paid to dispatch rider successfully",
      delivery,
    });
  } catch (error: any) {
    console.error("pay_food_delivery error:", error);
    return res.status(500).json({ msg: "Server error paying delivery rider", error: error.message });
  }
};

// 11. Get All Restaurant Deliveries (Active, Delivered, Cancelled)
// GET /api/v1/orders/vendor/deliveries
export const get_restaurant_deliveries = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    // Find all food orders for this restaurant that have a delivery_id
    const ordersWithDelivery = await FoodOrder.find({
      restaurant: restaurant._id,
      delivery_id: { $exists: true, $ne: null },
    }).select("_id order_number delivery_id status items pricing customer");

    const deliveryIds = ordersWithDelivery.map((o) => (o as any).delivery_id);

    // Also include any direct deliveries sent by restaurant user
    const deliveries = await Delivery.find({
      $or: [
        { _id: { $in: deliveryIds } },
        { sender: restaurant.user },
      ],
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "driver",
        select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
        populate: {
          path: "user",
          select: "name phone profile_pic",
        },
      })
      .populate({
        path: "food_order_id",
        select: "order_number items status pricing customer",
        populate: {
          path: "customer",
          select: "name phone profile_pic",
        },
      });

    return res.status(200).json({ msg: "success", rowCount: deliveries.length, deliveries });
  } catch (error: any) {
    console.error("get_restaurant_deliveries error:", error);
    return res.status(500).json({ msg: "Server error fetching restaurant deliveries", error: error.message });
  }
};

// 12. Retry Searching for Bike Rider (Restaurant Vendor)
// POST /api/v1/orders/:id/retry-delivery
export const retry_food_delivery = async (req: Request, res: Response) => {
  try {
    const restaurant = await getVendorRestaurant(req, res);
    if (!restaurant) return;

    const { id } = req.params;
    const order = await FoodOrder.findOne({
      _id: id,
      restaurant: restaurant._id,
    });

    if (!order) {
      return res.status(404).json({ msg: "Order not found or does not belong to your restaurant" });
    }

    if (!(order as any).delivery_id) {
      return res.status(400).json({ msg: "No dispatch delivery linked to retry" });
    }

    const delivery = await Delivery.findById((order as any).delivery_id);
    if (!delivery) {
      return res.status(404).json({ msg: "Delivery record not found" });
    }

    if (delivery.driver) {
      return res.status(400).json({ msg: "Driver has already accepted this delivery" });
    }

    // Reset status to pending
    delivery.status = "pending";
    await delivery.save();

    // Re-notify online bike drivers
    const bikeDrivers = await Driver.find({
      vehicle_type: "bike",
      is_online: true,
      is_busy: false,
    });

    await Promise.all(
      bikeDrivers.map(async (d: any) => {
        try {
          const driverSocket = await get_driver_socket_id(String(d._id));
          if (driverSocket) {
            io.to(driverSocket).emit("delivery_request", {
              delivery_id: delivery._id,
              msg: "Retrying food delivery request",
            });
          }
        } catch (e) {
          console.error("Failed to notify bike rider on retry", d._id, e);
        }
      })
    );

    // 30s timeout
    setTimeout(async () => {
      const d = await Delivery.findById(delivery._id);
      if (d && d.status === "pending") {
        d.status = "expired" as any;
        await d.save();

        io.emit("delivery_request_expired", {
          delivery_id: delivery._id,
          food_order_id: order._id,
          msg: "Food delivery request expired on retry",
        });

        const vendorSocket = await get_user_socket_id(restaurant.user);
        if (vendorSocket) {
          io.to(vendorSocket).emit("food_order_updated", {
            order_id: order._id,
            delivery_id: delivery._id,
            delivery_status: "expired",
            msg: "Retry rider search timed out.",
          });
        }

        io.to(`food_order_${order._id}`).emit("food_order_updated", {
          order_id: order._id,
          delivery_id: delivery._id,
          delivery_status: "expired",
          msg: "Retry rider search timed out",
        });
      }
    }, 30000);

    // Socket notification to vendor and tracking room
    io.to(`food_order_${order._id}`).emit("food_order_updated", {
      order_id: order._id,
      delivery_id: delivery._id,
      delivery_status: "pending",
      msg: "Retrying driver search...",
    });

    return res.status(200).json({
      msg: "Retrying bike rider search...",
      delivery,
    });
  } catch (error: any) {
    console.error("retry_food_delivery error:", error);
    return res.status(500).json({ msg: "Server error retrying driver search", error: error.message });
  }
};

