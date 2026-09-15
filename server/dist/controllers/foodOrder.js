"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry_food_delivery = exports.get_restaurant_deliveries = exports.pay_food_delivery = exports.get_food_order_delivery_status = exports.get_order_by_id = exports.get_vendor_orders = exports.get_customer_orders = exports.cancel_food_order = exports.mark_order_delivered = exports.mark_order_ready = exports.reject_food_order = exports.accept_food_order = exports.place_food_order = void 0;
const foodOrder_1 = __importDefault(require("../models/foodOrder"));
const basket_1 = __importDefault(require("../models/basket"));
const restaurant_1 = __importDefault(require("../models/restaurant"));
const wallet_1 = __importDefault(require("../models/wallet"));
const transaction_1 = __importDefault(require("../models/transaction"));
const user_1 = __importDefault(require("../models/user"));
const delivery_1 = __importDefault(require("../models/delivery"));
const driver_1 = __importDefault(require("../models/driver"));
const calc_commision_1 = require("../utils/calc_commision");
const get_vendor_restaurant_1 = require("../utils/get_vendor_restaurant");
const gen_unique_ref_1 = require("../utils/gen_unique_ref");
const get_id_1 = require("../utils/get_id");
const expo_push_1 = require("../utils/expo_push");
const server_1 = require("../server");
const agenda_1 = require("../jobs/agenda");
const complete_delivery_1 = require("../utils/complete_delivery");
const get_vendor_wallet_1 = require("../utils/get_vendor_wallet");
const FLAT_DELIVERY_FEE = 1500; // Flat rate 1500 NGN delivery fee per user requirement
// 1. Place Food Order (Customer)
// POST /api/v1/orders/place
const place_food_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        const user = yield user_1.default.findById(user_id);
        if (!user) {
            return res.status(404).json({ msg: "User account not found" });
        }
        // Fetch user basket specifically for this restaurant
        const basket = yield basket_1.default.findOne({
            user: user_id,
            restaurant: restaurant_id,
        }).populate("items.menu_item");
        if (!basket || !basket.items || basket.items.length === 0) {
            return res
                .status(400)
                .json({ msg: "Your basket for this restaurant is empty. Add items first." });
        }
        // Fetch restaurant
        const restaurant = yield restaurant_1.default.findById(basket.restaurant);
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
            const menuItem = item.menu_item;
            if (!menuItem || menuItem.is_deleted || !menuItem.is_available) {
                return res.status(400).json({
                    msg: `"${(menuItem === null || menuItem === void 0 ? void 0 : menuItem.name) || "An item"}" in your basket is currently unavailable. Please update your basket.`,
                });
            }
        }
        // Calculate Pricing
        const subtotal = basket.subtotal;
        const delivery_fee = FLAT_DELIVERY_FEE;
        const service_fee = 0;
        const total = subtotal + delivery_fee + service_fee;
        // Check In-App Wallet Balance
        let customerWallet = yield wallet_1.default.findOne({ owner_id: user_id });
        if (!customerWallet) {
            customerWallet = yield wallet_1.default.create({
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
        yield customerWallet.save();
        const paymentReference = (0, gen_unique_ref_1.generate_unique_reference)();
        // Build item snapshots
        const itemSnapshots = basket.items.map((item) => ({
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
        const coordinates = delivery_address.coordinates &&
            Array.isArray(delivery_address.coordinates)
            ? [
                Number(delivery_address.coordinates[0]),
                Number(delivery_address.coordinates[1]),
            ]
            : restaurant.location.coordinates.coordinates;
        const order = new foodOrder_1.default({
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
        yield order.save();
        // 1. Transaction Record for Customer (Money Out / Paid)
        yield transaction_1.default.create({
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
            const vendorWallet = yield (0, get_vendor_wallet_1.getOrCreateVendorWallet)(restaurant._id);
            vendorWallet.pending_balance = (vendorWallet.pending_balance || 0) + total;
            yield vendorWallet.save();
            yield transaction_1.default.create({
                wallet_id: vendorWallet._id,
                type: "vendor_earnings",
                amount: total,
                status: "pending",
                channel: "wallet",
                reference: (0, gen_unique_ref_1.generate_unique_reference)(),
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
        catch (vErr) {
            console.error("Error creating restaurant pending wallet balance on place order:", vErr);
        }
        // Clear ONLY this restaurant's Basket after order placement
        yield basket_1.default.findOneAndDelete({ user: user_id, restaurant: restaurant_id });
        // Schedule 3-Minute Vendor Response Timeout Job
        yield agenda_1.agenda.schedule("in 3 minutes", "check_food_order_timeout", {
            order_id: order._id,
        });
        // Real-Time Socket Notification to Vendor
        const vendorSocket = yield (0, get_id_1.get_user_socket_id)(restaurant.user);
        if (vendorSocket) {
            server_1.io.to(vendorSocket).emit("new_food_order", {
                order_id: order._id,
                order_number: order.order_number,
                customer_name: user.name,
                total: order.pricing.total,
                items_count: order.items.length,
            });
        }
        // Emit to vendor restaurant socket room
        server_1.io.to(`restaurant_${restaurant._id}`).emit("new_food_order", {
            order_id: order._id,
            order_number: order.order_number,
            customer_name: user.name,
            total: order.pricing.total,
        });
        // Expo Push Notification to Vendor User
        const vendorPushTokens = yield (0, get_id_1.get_user_push_tokens)(restaurant.user);
        if (vendorPushTokens.length > 0) {
            yield (0, expo_push_1.sendNotification)(vendorPushTokens, "New Food Order! 🍕", `New order #${order.order_number} from ${user.name} for ₦${total.toLocaleString()}. Please respond within 3 minutes.`, { type: "new_food_order", order_id: String(order._id) });
        }
        return res.status(201).json({
            msg: "Food order placed successfully",
            order,
        });
    }
    catch (error) {
        console.error("place_food_order error:", error);
        return res
            .status(500)
            .json({ msg: "Server error placing food order", error: error.message });
    }
});
exports.place_food_order = place_food_order;
// 2. Accept Food Order (Vendor)
// POST /api/v1/orders/:id/accept
const accept_food_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const order = yield foodOrder_1.default.findOne({
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
        yield order.save();
        // Verify vendor pending wallet balance exists for this order
        try {
            const vendorWallet = yield (0, get_vendor_wallet_1.getOrCreateVendorWallet)(restaurant._id);
            const existingTxn = yield transaction_1.default.findOne({
                wallet_id: vendorWallet._id,
                food_order_id: order._id,
            });
            if (!existingTxn) {
                const earningsAmount = ((_a = order.pricing) === null || _a === void 0 ? void 0 : _a.total) || 0;
                if (earningsAmount > 0) {
                    vendorWallet.pending_balance = (vendorWallet.pending_balance || 0) + earningsAmount;
                    yield vendorWallet.save();
                    yield transaction_1.default.create({
                        wallet_id: vendorWallet._id,
                        type: "vendor_earnings",
                        amount: earningsAmount,
                        status: "pending",
                        channel: "wallet",
                        reference: (0, gen_unique_ref_1.generate_unique_reference)(),
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
        }
        catch (wErr) {
            console.error("Error checking vendor pending balance on order accept:", wErr);
        }
        // Socket Notification to Customer
        const customerSocket = yield (0, get_id_1.get_user_socket_id)(order.customer);
        if (customerSocket) {
            server_1.io.to(customerSocket).emit("food_order_updated", {
                order_id: order._id,
                order_number: order.order_number,
                status: "preparing",
                msg: "Your food order has been accepted and is now being prepared! 🍳",
            });
        }
        // Emit to tracking room
        server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            status: "preparing",
            msg: "Order accepted by restaurant",
        });
        // Push notification to Customer
        const customerPushTokens = yield (0, get_id_1.get_user_push_tokens)(order.customer);
        if (customerPushTokens.length > 0) {
            yield (0, expo_push_1.sendNotification)(customerPushTokens, "Order Accepted! 🍳", `${restaurant.name} has accepted your order #${order.order_number} and started preparing it!`, { type: "food_order_accepted", order_id: String(order._id) });
        }
        return res.status(200).json({
            msg: "Food order accepted",
            order,
        });
    }
    catch (error) {
        console.error("accept_food_order error:", error);
        return res
            .status(500)
            .json({ msg: "Server error accepting food order", error: error.message });
    }
});
exports.accept_food_order = accept_food_order;
// 3. Reject Food Order (Vendor)
// POST /api/v1/orders/:id/reject
const reject_food_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const { reason } = req.body;
        const order = yield foodOrder_1.default.findOne({
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
        yield order.save();
        // Cancel pending vendor earnings for this order
        yield (0, get_vendor_wallet_1.cancelVendorOrderPendingEarnings)(order);
        // Refund customer's in-app wallet
        const customerWallet = yield wallet_1.default.findOne({ owner_id: order.customer });
        if (customerWallet) {
            customerWallet.balance += order.pricing.total;
            yield customerWallet.save();
            yield transaction_1.default.create({
                wallet_id: customerWallet._id,
                type: "payout",
                amount: order.pricing.total,
                status: "success",
                channel: "wallet",
                reference: (0, gen_unique_ref_1.generate_unique_reference)(),
                food_order_id: order._id,
                metadata: {
                    order_id: order._id,
                    order_number: order.order_number,
                    reason: "Vendor order rejection refund",
                },
            });
        }
        // Socket notification to Customer
        const customerSocket = yield (0, get_id_1.get_user_socket_id)(order.customer);
        if (customerSocket) {
            server_1.io.to(customerSocket).emit("food_order_updated", {
                order_id: order._id,
                order_number: order.order_number,
                status: "rejected",
                msg: "Your food order was declined by the restaurant. Your money has been refunded to your wallet.",
            });
        }
        server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            status: "rejected",
            msg: "Order declined by restaurant",
        });
        // Push notification to Customer
        const customerPushTokens = yield (0, get_id_1.get_user_push_tokens)(order.customer);
        if (customerPushTokens.length > 0) {
            yield (0, expo_push_1.sendNotification)(customerPushTokens, "Order Declined 💳", `Your order #${order.order_number} was declined. ₦${order.pricing.total.toLocaleString()} has been refunded to your wallet.`, { type: "food_order_rejected", order_id: String(order._id) });
        }
        return res.status(200).json({
            msg: "Food order rejected and customer refunded",
            order,
        });
    }
    catch (error) {
        console.error("reject_food_order error:", error);
        return res
            .status(500)
            .json({ msg: "Server error rejecting food order", error: error.message });
    }
});
exports.reject_food_order = reject_food_order;
// 4. Mark Food Ready for Pickup (Vendor) — dispatches a bike rider delivery
// POST /api/v1/orders/:id/ready
const mark_order_ready = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const order = yield foodOrder_1.default.findOne({
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
        yield order.save();
        // ─── Dispatch a bike rider delivery ───
        try {
            const commission = (0, calc_commision_1.calculate_commission)(FLAT_DELIVERY_FEE);
            const driver_earnings = FLAT_DELIVERY_FEE - commission;
            // Restaurant location is the pickup; customer address is the dropoff
            const [restLat, restLng] = order.restaurant_address.coordinates;
            const [custLat, custLng] = order.delivery_address.coordinates;
            const new_delivery = yield delivery_1.default.create({
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
                distance_km: 0, // rider uses in-app navigation
                duration_mins: 0,
                // Payment unpaid until restaurant confirms rider arrival and pays
                payment_status: "unpaid",
                payment_method: "wallet",
                status: "pending",
                food_order_id: order._id,
            });
            // Save delivery reference on the food order
            order.delivery_id = new_delivery._id;
            yield order.save();
            // Notify all online bike riders via socket
            const bikeDrivers = yield driver_1.default.find({
                vehicle_type: "bike",
                is_online: true,
                is_busy: false,
            });
            yield Promise.all(bikeDrivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const driverSocket = yield (0, get_id_1.get_driver_socket_id)(String(d._id));
                    if (driverSocket) {
                        server_1.io.to(driverSocket).emit("delivery_request", {
                            delivery_id: new_delivery._id,
                        });
                    }
                }
                catch (e) {
                    console.error("Failed to notify bike rider", d._id, e);
                }
            })));
            // Expiry timer (30s) — same as normal delivery
            setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
                const d = yield delivery_1.default.findById(new_delivery._id);
                if (d && d.status === "pending") {
                    d.status = "expired";
                    yield d.save();
                    server_1.io.emit("delivery_request_expired", {
                        delivery_id: new_delivery._id,
                        food_order_id: order._id,
                        msg: "Food delivery request expired — no rider accepted in time",
                    });
                    const vendorSocket = yield (0, get_id_1.get_user_socket_id)(restaurant.user);
                    if (vendorSocket) {
                        server_1.io.to(vendorSocket).emit("food_order_updated", {
                            order_id: order._id,
                            delivery_id: new_delivery._id,
                            delivery_status: "expired",
                            msg: "No rider was found for your food order. Click to retry search.",
                        });
                    }
                    server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
                        order_id: order._id,
                        delivery_id: new_delivery._id,
                        delivery_status: "expired",
                        msg: "Rider search timed out",
                    });
                }
            }), 30000);
            console.log(`Food delivery dispatched: ${new_delivery._id} for order ${order.order_number}`);
        }
        catch (dispatchErr) {
            // Non-fatal: log but don't fail the whole request
            console.error("Failed to dispatch bike delivery for food order:", dispatchErr);
        }
        // ─── End dispatch ───
        // Socket notification to customer
        const customerSocket = yield (0, get_id_1.get_user_socket_id)(order.customer);
        if (customerSocket) {
            server_1.io.to(customerSocket).emit("food_order_updated", {
                order_id: order._id,
                order_number: order.order_number,
                status: "ready_for_pickup",
                msg: "Your food order is ready! A delivery rider will pick it up shortly.",
            });
        }
        server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            status: "ready_for_pickup",
            msg: "Order is ready for pickup — dispatch rider notified",
        });
        return res.status(200).json({
            msg: "Food order marked as ready for pickup. Dispatch rider notified.",
            order,
        });
    }
    catch (error) {
        console.error("mark_order_ready error:", error);
        return res
            .status(500)
            .json({
            msg: "Server error updating order status",
            error: error.message,
        });
    }
});
exports.mark_order_ready = mark_order_ready;
// 4b. Mark Food Order as Delivered (Vendor or Driver)
// POST /api/v1/orders/:id/deliver
const mark_order_delivered = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const order = yield foodOrder_1.default.findById(id);
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
        yield order.save();
        // Settle vendor earnings: credits restaurant with subtotal only (delivery_fee goes to rider)
        yield (0, get_vendor_wallet_1.settleVendorOrderEarnings)(order);
        // Complete linked delivery (credit bike rider wallet) if one was dispatched
        if (order.delivery_id) {
            try {
                const linkedDelivery = yield delivery_1.default.findById(order.delivery_id);
                if (linkedDelivery && linkedDelivery.status === "in_transit") {
                    const result = yield (0, complete_delivery_1.complete_delivery)(linkedDelivery);
                    if (!result.success) {
                        console.error("Failed to complete linked delivery for food order:", result.message);
                    }
                }
            }
            catch (deliveryErr) {
                console.error("Error completing linked delivery:", deliveryErr);
            }
        }
        // Socket notification to Customer
        const customerSocket = yield (0, get_id_1.get_user_socket_id)(order.customer);
        if (customerSocket) {
            server_1.io.to(customerSocket).emit("food_order_updated", {
                order_id: order._id,
                order_number: order.order_number,
                status: "delivered",
                msg: "Your food order has been delivered! Enjoy your meal 🍔",
            });
        }
        server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            status: "delivered",
            msg: "Order delivered successfully",
        });
        return res.status(200).json({
            msg: "Food order marked as delivered and vendor wallet credited",
            order,
        });
    }
    catch (error) {
        console.error("mark_order_delivered error:", error);
        return res
            .status(500)
            .json({
            msg: "Server error marking order delivered",
            error: error.message,
        });
    }
});
exports.mark_order_delivered = mark_order_delivered;
// 5. Cancel Food Order (Customer)
// POST /api/v1/orders/:id/cancel
const cancel_food_order = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const { id } = req.params;
        const { reason } = req.body;
        const order = yield foodOrder_1.default.findOne({
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
        yield order.save();
        // Cancel vendor pending earnings for this order
        yield (0, get_vendor_wallet_1.cancelVendorOrderPendingEarnings)(order);
        // Refund customer's in-app wallet balance
        const customerWallet = yield wallet_1.default.findOne({ owner_id: user_id });
        if (customerWallet) {
            customerWallet.balance += order.pricing.total;
            yield customerWallet.save();
            yield transaction_1.default.create({
                wallet_id: customerWallet._id,
                type: "payout",
                amount: order.pricing.total,
                status: "success",
                channel: "wallet",
                reference: (0, gen_unique_ref_1.generate_unique_reference)(),
                food_order_id: order._id,
                metadata: {
                    order_id: order._id,
                    order_number: order.order_number,
                    reason: "Customer order cancellation refund",
                },
            });
        }
        // Socket notification to vendor
        const restaurant = yield restaurant_1.default.findById(order.restaurant);
        if (restaurant === null || restaurant === void 0 ? void 0 : restaurant.user) {
            const vendorSocket = yield (0, get_id_1.get_user_socket_id)(restaurant.user);
            if (vendorSocket) {
                server_1.io.to(vendorSocket).emit("food_order_cancelled", {
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
    }
    catch (error) {
        console.error("cancel_food_order error:", error);
        return res
            .status(500)
            .json({
            msg: "Server error cancelling food order",
            error: error.message,
        });
    }
});
exports.cancel_food_order = cancel_food_order;
// 6. Get Customer Orders
// GET /api/v1/orders/customer
const get_customer_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const user_id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!user_id) {
            return res.status(401).json({ msg: "User not authenticated" });
        }
        const orders = yield foodOrder_1.default.find({ customer: user_id })
            .populate("restaurant", "name logo phone location")
            .sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    }
    catch (error) {
        console.error("get_customer_orders error:", error);
        return res
            .status(500)
            .json({
            msg: "Server error fetching customer orders",
            error: error.message,
        });
    }
});
exports.get_customer_orders = get_customer_orders;
// 7. Get Vendor Orders
// GET /api/v1/orders/vendor
const get_vendor_orders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const orders = yield foodOrder_1.default.find({ restaurant: restaurant._id })
            .populate("customer", "name phone profile_pic")
            .sort({ createdAt: -1 });
        return res.status(200).json({ orders });
    }
    catch (error) {
        console.error("get_vendor_orders error:", error);
        return res
            .status(500)
            .json({
            msg: "Server error fetching vendor orders",
            error: error.message,
        });
    }
});
exports.get_vendor_orders = get_vendor_orders;
// 8. Get Order Details
// GET /api/v1/orders/:id
const get_order_by_id = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        let order = yield foodOrder_1.default.findById(id)
            .populate("customer", "name phone profile_pic")
            .populate("restaurant", "name logo phone location category_tags")
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle rating num_of_reviews current_location",
            populate: {
                path: "user",
                select: "name phone profile_pic",
            },
        });
        if (!order) {
            return res.status(404).json({ msg: "Order not found" });
        }
        // Fallback: If order.driver is missing but delivery_id has a driver
        if (!order.driver && order.delivery_id) {
            try {
                const del = yield delivery_1.default.findById(order.delivery_id).populate({
                    path: "driver",
                    select: "user vehicle_type vehicle rating num_of_reviews current_location",
                    populate: {
                        path: "user",
                        select: "name phone profile_pic",
                    },
                });
                if (del && del.driver) {
                    order.driver = del.driver;
                }
            }
            catch (e) {
                console.error("Error populating driver fallback from delivery:", e);
            }
        }
        return res.status(200).json({ order });
    }
    catch (error) {
        console.error("get_order_by_id error:", error);
        return res
            .status(500)
            .json({
            msg: "Server error fetching order details",
            error: error.message,
        });
    }
});
exports.get_order_by_id = get_order_by_id;
// 9. Get Linked Delivery Status for a Food Order
// GET /api/v1/orders/:id/delivery
const get_food_order_delivery_status = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const order = yield foodOrder_1.default.findById(id).select("delivery_id customer");
        if (!order) {
            return res.status(404).json({ msg: "Food order not found" });
        }
        if (!order.delivery_id) {
            return res
                .status(404)
                .json({ msg: "No dispatch delivery linked to this food order yet" });
        }
        const delivery = yield delivery_1.default.findById(order.delivery_id)
            .populate({
            path: "driver",
            select: "user vehicle_type vehicle current_location total_trips rating num_of_reviews",
            populate: {
                path: "user",
                select: "name phone profile_pic",
            },
        });
        return res.status(200).json({ msg: "success", delivery });
    }
    catch (error) {
        console.error("get_food_order_delivery_status error:", error);
        return res.status(500).json({
            msg: "Server error fetching delivery status",
            error: error.message,
        });
    }
});
exports.get_food_order_delivery_status = get_food_order_delivery_status;
// 10. Pay Food Delivery Rider (Restaurant Vendor)
// POST /api/v1/orders/:id/pay-delivery
const pay_food_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const order = yield foodOrder_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
        });
        if (!order) {
            return res.status(404).json({ msg: "Order not found or does not belong to your restaurant" });
        }
        if (!order.delivery_id) {
            return res.status(404).json({ msg: "No linked delivery found for this order" });
        }
        const delivery = yield delivery_1.default.findById(order.delivery_id);
        if (!delivery) {
            return res.status(404).json({ msg: "Delivery record not found" });
        }
        if (delivery.payment_status === "paid") {
            return res.status(400).json({ msg: "Delivery fee has already been paid" });
        }
        if (delivery.status !== "arrived") {
            return res.status(400).json({ msg: "Dispatch rider has not arrived yet" });
        }
        // Note: Escrow holds total payment; delivery fee is released to driver on completion.
        delivery.payment_status = "paid";
        yield delivery.save();
        // Socket Notifications to driver and vendor
        const driverSocket = delivery.driver ? yield (0, get_id_1.get_driver_socket_id)(delivery.driver.toString()) : null;
        if (driverSocket) {
            server_1.io.to(driverSocket).emit("delivery_paid", {
                delivery_id: delivery._id,
                msg: "Restaurant vendor has paid the delivery fee!",
            });
        }
        server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            status: order.status,
            payment_status: "paid",
            msg: "Vendor paid delivery fee to rider",
        });
        return res.status(200).json({
            msg: "Delivery fee paid to dispatch rider successfully",
            delivery,
        });
    }
    catch (error) {
        console.error("pay_food_delivery error:", error);
        return res.status(500).json({ msg: "Server error paying delivery rider", error: error.message });
    }
});
exports.pay_food_delivery = pay_food_delivery;
// 11. Get All Restaurant Deliveries (Active, Delivered, Cancelled)
// GET /api/v1/orders/vendor/deliveries
const get_restaurant_deliveries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        // Find all food orders for this restaurant that have a delivery_id
        const ordersWithDelivery = yield foodOrder_1.default.find({
            restaurant: restaurant._id,
            delivery_id: { $exists: true, $ne: null },
        }).select("_id order_number delivery_id status items pricing customer");
        const deliveryIds = ordersWithDelivery.map((o) => o.delivery_id);
        // Also include any direct deliveries sent by restaurant user
        const deliveries = yield delivery_1.default.find({
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
    }
    catch (error) {
        console.error("get_restaurant_deliveries error:", error);
        return res.status(500).json({ msg: "Server error fetching restaurant deliveries", error: error.message });
    }
});
exports.get_restaurant_deliveries = get_restaurant_deliveries;
// 12. Retry Searching for Bike Rider (Restaurant Vendor)
// POST /api/v1/orders/:id/retry-delivery
const retry_food_delivery = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const restaurant = yield (0, get_vendor_restaurant_1.getVendorRestaurant)(req, res);
        if (!restaurant)
            return;
        const { id } = req.params;
        const order = yield foodOrder_1.default.findOne({
            _id: id,
            restaurant: restaurant._id,
        });
        if (!order) {
            return res.status(404).json({ msg: "Order not found or does not belong to your restaurant" });
        }
        if (!order.delivery_id) {
            return res.status(400).json({ msg: "No dispatch delivery linked to retry" });
        }
        const delivery = yield delivery_1.default.findById(order.delivery_id);
        if (!delivery) {
            return res.status(404).json({ msg: "Delivery record not found" });
        }
        if (delivery.driver) {
            return res.status(400).json({ msg: "Driver has already accepted this delivery" });
        }
        // Reset status to pending
        delivery.status = "pending";
        yield delivery.save();
        // Re-notify online bike drivers
        const bikeDrivers = yield driver_1.default.find({
            vehicle_type: "bike",
            is_online: true,
            is_busy: false,
        });
        yield Promise.all(bikeDrivers.map((d) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const driverSocket = yield (0, get_id_1.get_driver_socket_id)(String(d._id));
                if (driverSocket) {
                    server_1.io.to(driverSocket).emit("delivery_request", {
                        delivery_id: delivery._id,
                        msg: "Retrying food delivery request",
                    });
                }
            }
            catch (e) {
                console.error("Failed to notify bike rider on retry", d._id, e);
            }
        })));
        // 30s timeout
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            const d = yield delivery_1.default.findById(delivery._id);
            if (d && d.status === "pending") {
                d.status = "expired";
                yield d.save();
                server_1.io.emit("delivery_request_expired", {
                    delivery_id: delivery._id,
                    food_order_id: order._id,
                    msg: "Food delivery request expired on retry",
                });
                const vendorSocket = yield (0, get_id_1.get_user_socket_id)(restaurant.user);
                if (vendorSocket) {
                    server_1.io.to(vendorSocket).emit("food_order_updated", {
                        order_id: order._id,
                        delivery_id: delivery._id,
                        delivery_status: "expired",
                        msg: "Retry rider search timed out.",
                    });
                }
                server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
                    order_id: order._id,
                    delivery_id: delivery._id,
                    delivery_status: "expired",
                    msg: "Retry rider search timed out",
                });
            }
        }), 30000);
        // Socket notification to vendor and tracking room
        server_1.io.to(`food_order_${order._id}`).emit("food_order_updated", {
            order_id: order._id,
            delivery_id: delivery._id,
            delivery_status: "pending",
            msg: "Retrying driver search...",
        });
        return res.status(200).json({
            msg: "Retrying bike rider search...",
            delivery,
        });
    }
    catch (error) {
        console.error("retry_food_delivery error:", error);
        return res.status(500).json({ msg: "Server error retrying driver search", error: error.message });
    }
});
exports.retry_food_delivery = retry_food_delivery;
