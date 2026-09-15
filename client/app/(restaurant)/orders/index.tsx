import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
  Linking,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRestaurantContext } from "../../../context/RestaurantContext";
import { useFoodOrderContext } from "../../../context/FoodOrderContext";
import { getUserSocket } from "../../../sockets/socketService";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface OrderItemOption {
  group_name: string;
  option_name: string;
  price_modifier: number;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
  selected_options?: OrderItemOption[];
  special_instructions?: string;
  item_total: number;
}

export interface VendorFoodOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_avatar?: string;
  delivery_address: string;
  delivery_landmark?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status:
    | "placed"
    | "preparing"
    | "ready_for_pickup"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "rejected";
  payment_method: "wallet" | "card" | "cash";
  placed_at: string;
  preparing_at?: string;
  ready_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  rejection_reason?: string;
}

type FilterTab = "active" | "in_transit" | "completed" | "cancelled";

// ─── Live Orders Screen ───────────────────────────────────────────────────────

const RestaurantOrders = () => {
  const insets = useSafeAreaInsets();
  const { restaurant } = useRestaurantContext();
  const {
    vendorOrders,
    fetchVendorOrders,
    acceptOrder,
    rejectOrder,
    markOrderReady,
    payDeliveryRider,
    retryDeliveryRider,
    getFoodOrderDelivery,
  } = useFoodOrderContext();

  const [orders, setOrders] = useState<VendorFoodOrder[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("active");

  const [deliveriesMap, setDeliveriesMap] = useState<Record<string, any>>({});
  const [searchingMap, setSearchingMap] = useState<Record<string, boolean>>({});
  const [payingMap, setPayingMap] = useState<Record<string, boolean>>({});

  // Decline Modal State
  const [declineModalVisible, setDeclineModalVisible] = useState(false);
  const [declineTargetOrder, setDeclineTargetOrder] =
    useState<VendorFoodOrder | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  // Order Details Modal State
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<VendorFoodOrder | null>(
    null,
  );

  // Load delivery details for active orders
  const loadDeliveries = async (ordersList: VendorFoodOrder[]) => {
    const activeWithDelivery = ordersList.filter(
      (o) =>
        o.status === "ready_for_pickup" ||
        o.status === "in_transit" ||
        o.status === "preparing",
    );
    const updatedMap: Record<string, any> = {};
    await Promise.all(
      activeWithDelivery.map(async (o) => {
        try {
          const del = await getFoodOrderDelivery(o.id);
          if (del) {
            updatedMap[o.id] = del;
          }
        } catch (e) {}
      }),
    );
    setDeliveriesMap((prev) => ({ ...prev, ...updatedMap }));
  };

  // Fetch backend orders on mount
  useEffect(() => {
    fetchVendorOrders();
  }, []);

  // Synchronize context vendorOrders to UI state
  useEffect(() => {
    if (vendorOrders) {
      const mapped: VendorFoodOrder[] = vendorOrders.map((o) => {
        const custName =
          typeof o.customer === "object" ? o.customer?.name : "Customer";
        const custPhone =
          typeof o.customer === "object"
            ? o.customer?.phone || "+234 800 000 0000"
            : "+234 800 000 0000";
        const custPic =
          typeof o.customer === "object" ? o.customer?.profile_pic : undefined;

        return {
          id: o._id,
          order_number: o.order_number,
          customer_name: custName,
          customer_phone: custPhone,
          customer_avatar: custPic,
          delivery_address: o.delivery_address?.address || "Delivery Address",
          delivery_landmark: o.delivery_address?.landmark || "",
          items: (o.items || []).map((it) => ({
            menu_item_id: String(it.menu_item_id),
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            selected_options: it.selected_options || [],
            special_instructions: it.special_instructions || "",
            item_total: it.item_total,
          })),
          subtotal: o.pricing?.subtotal || 0,
          delivery_fee: o.pricing?.delivery_fee || 0,
          total: o.pricing?.total || 0,
          status: o.status,
          payment_method: o.payment?.method || "wallet",
          placed_at: new Date(o.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          rejection_reason: o.cancellation?.reason,
        };
      });
      setOrders(mapped);
      loadDeliveries(mapped);
    }
  }, [vendorOrders]);

  // Real-time socket listeners
  useEffect(() => {
    const socket = getUserSocket();
    if (socket) {
      socket.on("new_food_order", (data: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchVendorOrders();
      });

      socket.on("food_order_cancelled", (data: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        fetchVendorOrders();
      });

      socket.on("food_order_updated", (data: any) => {
        fetchVendorOrders();
      });

      socket.on("delivery_accepted", (data: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchVendorOrders();
      });

      socket.on("delivery_arrived", (data: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchVendorOrders();
      });

      socket.on("delivery_paid", (data: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        fetchVendorOrders();
      });

      socket.on("delivery_request_expired", (data: any) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        if (data?.food_order_id || data?.delivery_id) {
          setDeliveriesMap((prev) => {
            const copy = { ...prev };
            const targetId =
              data.food_order_id ||
              Object.keys(copy).find((k) => copy[k]?._id === data.delivery_id);
            if (targetId && copy[targetId]) {
              copy[targetId] = { ...copy[targetId], status: "expired" };
            }
            return copy;
          });
        }
        fetchVendorOrders();
      });

      return () => {
        socket.off("new_food_order");
        socket.off("food_order_cancelled");
        socket.off("food_order_updated");
        socket.off("delivery_accepted");
        socket.off("delivery_arrived");
        socket.off("delivery_paid");
        socket.off("delivery_request_expired");
      };
    }
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleAcceptOrder = async (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await acceptOrder(orderId);
    if (!updated) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "preparing",
                preparing_at: "Just now",
              }
            : o,
        ),
      );
    }
  };

  const handleSearchForDriver = async (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const updated = await markOrderReady(orderId);
      if (updated) {
        const del = await getFoodOrderDelivery(orderId);
        if (del) {
          setDeliveriesMap((prev) => ({ ...prev, [orderId]: del }));
        }
      }
    } finally {
      setSearchingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleRetryDriverSearch = async (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSearchingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const success = await retryDeliveryRider(orderId);
      if (success) {
        const del = await getFoodOrderDelivery(orderId);
        if (del) {
          setDeliveriesMap((prev) => ({ ...prev, [orderId]: del }));
        }
      }
    } finally {
      setSearchingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handlePayRider = async (orderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const success = await payDeliveryRider(orderId);
      if (success) {
        const del = await getFoodOrderDelivery(orderId);
        if (del) {
          setDeliveriesMap((prev) => ({ ...prev, [orderId]: del }));
        }
      }
    } finally {
      setPayingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleOpenDeclineModal = (order: VendorFoodOrder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeclineTargetOrder(order);
    setDeclineReason("");
    setDeclineModalVisible(true);
  };

  const handleConfirmDecline = async () => {
    if (!declineTargetOrder) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await rejectOrder(declineTargetOrder.id, declineReason.trim());
    setOrders((prev) =>
      prev.map((o) =>
        o.id === declineTargetOrder.id
          ? {
              ...o,
              status: "rejected",
              rejection_reason: declineReason.trim() || "Declined by vendor",
              cancelled_at: "Just now",
            }
          : o,
      ),
    );
    setDeclineModalVisible(false);
    setDeclineTargetOrder(null);
    setDeclineReason("");
    Alert.alert("Order Declined", "Customer has been notified and refunded.");
  };

  const handleCallCustomer = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone.replace(/\s+/g, "")}`);
  };

  const handleOpenDetails = (order: VendorFoodOrder) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOrder(order);
    setDetailsModalVisible(true);
  };

  // ── Filter Orders ───────────────────────────────────────────────────────────

  const getFilteredOrders = (): VendorFoodOrder[] => {
    if (activeTab === "active") {
      return orders.filter((o) =>
        ["placed", "preparing", "ready_for_pickup"].includes(o.status),
      );
    } else if (activeTab === "in_transit") {
      return orders.filter((o) => o.status === "in_transit");
    } else if (activeTab === "completed") {
      return orders.filter((o) => o.status === "delivered");
    } else {
      return orders.filter((o) => ["cancelled", "rejected"].includes(o.status));
    }
  };

  const filteredOrders = getFilteredOrders();
  const placedCount = orders.filter((o) => o.status === "placed").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14,
        },
      ]}
    >
      {/* ── Top Bar (Only Back Button) ── */}
      <View style={styles.top_nav}>
        <TouchableOpacity
          style={styles.nav_icon_btn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header_center}>
          <Text style={styles.header_title}>Live Orders</Text>
          <Text style={styles.header_sub}>
            {restaurant?.name || "Vendor Dashboard"} •{" "}
            {
              orders.filter((o) => ["placed", "preparing"].includes(o.status))
                .length
            }{" "}
            Active
          </Text>
        </View>

        <View style={styles.live_badge}>
          <View style={styles.live_badge_dot} />
          <Text style={styles.live_badge_text}>LIVE</Text>
        </View>
      </View>

      {/* ── Status Filter Tabs ── */}
      <View style={styles.tabs_wrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs_container}
        >
          <TouchableOpacity
            style={[
              styles.tab_chip,
              activeTab === "active" && styles.tab_chip_active,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("active");
            }}
          >
            <Text
              style={[
                styles.tab_chip_text,
                activeTab === "active" && styles.tab_chip_text_active,
              ]}
            >
              Kitchen & Active (
              {
                orders.filter((o) =>
                  ["placed", "preparing", "ready_for_pickup"].includes(
                    o.status,
                  ),
                ).length
              }
              )
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab_chip,
              activeTab === "in_transit" && styles.tab_chip_active,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("in_transit");
            }}
          >
            <Text
              style={[
                styles.tab_chip_text,
                activeTab === "in_transit" && styles.tab_chip_text_active,
              ]}
            >
              In Transit (
              {orders.filter((o) => o.status === "in_transit").length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab_chip,
              activeTab === "completed" && styles.tab_chip_active,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("completed");
            }}
          >
            <Text
              style={[
                styles.tab_chip_text,
                activeTab === "completed" && styles.tab_chip_text_active,
              ]}
            >
              Completed ({orders.filter((o) => o.status === "delivered").length}
              )
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab_chip,
              activeTab === "cancelled" && styles.tab_chip_active,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab("cancelled");
            }}
          >
            <Text
              style={[
                styles.tab_chip_text,
                activeTab === "cancelled" && styles.tab_chip_text_active,
              ]}
            >
              Declined (
              {
                orders.filter((o) =>
                  ["cancelled", "rejected"].includes(o.status),
                ).length
              }
              )
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Main Orders Scroll ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 40 : 50 },
        ]}
      >
        {/* Urgent New Incoming Orders Highlight Bar */}
        {placedCount > 0 && activeTab === "active" && (
          <View style={styles.urgent_alert_bar}>
            <View style={styles.urgent_pulse_dot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.urgent_alert_title}>
                {placedCount} NEW INCOMING ORDER{placedCount > 1 ? "S" : ""}!
              </Text>
              <Text style={styles.urgent_alert_sub}>
                Respond within 3 minutes to accept or decline.
              </Text>
            </View>
          </View>
        )}

        {filteredOrders.length === 0 ? (
          <View style={styles.empty_state}>
            <Feather name="shopping-bag" size={42} color="#444" />
            <Text style={styles.empty_title}>No Orders in this Section</Text>
            <Text style={styles.empty_sub}>
              {activeTab === "active"
                ? "No active orders right now. New customer food orders will appear here automatically."
                : "No orders found for this filter."}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => {
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.order_card}
                activeOpacity={0.92}
                onPress={() => handleOpenDetails(order)}
              >
                {/* Order Header Row */}
                <View style={styles.card_header}>
                  <View>
                    <View style={styles.order_num_row}>
                      <Text style={styles.order_num_text}>
                        {order.order_number}
                      </Text>
                      <Text style={styles.time_ago_text}>
                        • {order.placed_at}
                      </Text>
                    </View>
                    <Text style={styles.customer_name}>
                      {order.customer_name}
                    </Text>
                  </View>

                  {/* Status Badge */}
                  {order.status === "placed" && (
                    <View style={[styles.status_chip, styles.chip_placed]}>
                      <View
                        style={[
                          styles.status_dot_small,
                          { backgroundColor: "#ffc107" },
                        ]}
                      />
                      <Text
                        style={[styles.status_chip_text, { color: "#ffc107" }]}
                      >
                        NEW ORDER
                      </Text>
                    </View>
                  )}

                  {order.status === "preparing" && (
                    <View style={[styles.status_chip, styles.chip_preparing]}>
                      <Text
                        style={[styles.status_chip_text, { color: "#ff9800" }]}
                      >
                        🍳 PREPARING
                      </Text>
                    </View>
                  )}

                  {order.status === "ready_for_pickup" && (
                    <View style={[styles.status_chip, styles.chip_ready]}>
                      <Text
                        style={[styles.status_chip_text, { color: "#2196f3" }]}
                      >
                        📦 READY FOR PICKUP
                      </Text>
                    </View>
                  )}

                  {order.status === "in_transit" && (
                    <View style={[styles.status_chip, styles.chip_transit]}>
                      <Text
                        style={[styles.status_chip_text, { color: "#9c27b0" }]}
                      >
                        🚚 IN TRANSIT
                      </Text>
                    </View>
                  )}

                  {order.status === "delivered" && (
                    <View style={[styles.status_chip, styles.chip_delivered]}>
                      <Text
                        style={[styles.status_chip_text, { color: "#4caf50" }]}
                      >
                        ✅ DELIVERED
                      </Text>
                    </View>
                  )}

                  {(order.status === "cancelled" ||
                    order.status === "rejected") && (
                    <View style={[styles.status_chip, styles.chip_cancelled]}>
                      <Text
                        style={[styles.status_chip_text, { color: "#ef5350" }]}
                      >
                        ❌{" "}
                        {order.status === "rejected" ? "DECLINED" : "CANCELLED"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Items Summary Box */}
                <View style={styles.items_box}>
                  {order.items.map((item, iIdx) => (
                    <View key={iIdx} style={styles.item_line}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.item_line_name}>
                          <Text style={styles.item_qty}>{item.quantity}x </Text>
                          {item.name}
                        </Text>

                        {/* Selected Options */}
                        {item.selected_options &&
                          item.selected_options.length > 0 && (
                            <Text style={styles.item_options_text}>
                              {item.selected_options
                                .map((o) => `${o.group_name}: ${o.option_name}`)
                                .join(" • ")}
                            </Text>
                          )}

                        {/* Special instructions */}
                        {item.special_instructions ? (
                          <View style={styles.instructions_box}>
                            <Text style={styles.instructions_text}>
                              💬 "{item.special_instructions}"
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text style={styles.item_line_price}>
                        ₦{item.item_total.toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Customer Contact & Delivery Info */}
                <View style={styles.delivery_info_row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.address_line}>
                      <Feather name="map-pin" size={13} color="#9CA3AF" />
                      <Text style={styles.address_text} numberOfLines={1}>
                        {order.delivery_address}
                      </Text>
                    </View>
                    {order.delivery_landmark ? (
                      <Text style={styles.landmark_text}>
                        Landmark: {order.delivery_landmark}
                      </Text>
                    ) : null}
                  </View>

                  {/* Phone Call Button */}
                  <TouchableOpacity
                    style={styles.call_btn}
                    onPress={() => handleCallCustomer(order.customer_phone)}
                  >
                    <Feather name="phone-call" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>

                {/* Driver Details & Rider Payment Section */}
                {deliveriesMap[order.id]?.driver && (
                  <View style={styles.driver_card}>
                    <View style={styles.driver_avatar_wrapper}>
                      {deliveriesMap[order.id].driver.user?.profile_pic ? (
                        <Image
                          source={{
                            uri: deliveriesMap[order.id].driver.user
                              .profile_pic,
                          }}
                          style={styles.driver_avatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.driver_avatar_placeholder}>
                          <FontAwesome5
                            name="motorcycle"
                            size={16}
                            color="#4caf50"
                          />
                        </View>
                      )}
                    </View>

                    <View style={styles.driver_info_col}>
                      <View style={styles.driver_name_row}>
                        <Text style={styles.driver_name_text} numberOfLines={1}>
                          {deliveriesMap[order.id].driver.user?.name ||
                            "Dispatch Rider"}
                        </Text>
                        <View style={styles.driver_rating_badge}>
                          <Feather name="star" size={10} color="#ffc107" />
                          <Text style={styles.driver_rating_text}>
                            {(
                              deliveriesMap[order.id].driver.rating || 5.0
                            ).toFixed(1)}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.driver_sub_text} numberOfLines={1}>
                        {(
                          deliveriesMap[order.id].driver.vehicle_type || "BIKE"
                        ).toUpperCase()}{" "}
                        DISPATCH •{" "}
                        {deliveriesMap[order.id].driver.user?.phone ||
                          "+234 800 000 0000"}
                      </Text>

                      <Text style={styles.driver_notice_text}>
                        {deliveriesMap[order.id].status === "arrived"
                          ? "Rider has arrived at your restaurant!"
                          : deliveriesMap[order.id].status === "in_transit"
                            ? "Rider is delivering order to customer"
                            : "Rider on the way"}
                      </Text>
                    </View>

                    {/* Dedicated 1-Tap Driver Call Button */}
                    <TouchableOpacity
                      style={styles.driver_call_btn}
                      onPress={() =>
                        handleCallCustomer(
                          deliveriesMap[order.id].driver.user?.phone || "",
                        )
                      }
                    >
                      <Feather name="phone-call" size={15} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Price & Action Row */}
                <View style={styles.pricing_footer}>
                  <View>
                    <Text style={styles.total_label}>TOTAL EARNINGS</Text>
                    <Text style={styles.total_price_text}>
                      ₦{order.total.toLocaleString()}
                    </Text>
                  </View>

                  {/* Dynamic Action Buttons based on Status */}
                  {order.status === "placed" && (
                    <View style={styles.action_group}>
                      <TouchableOpacity
                        style={styles.decline_btn}
                        onPress={() => handleOpenDeclineModal(order)}
                      >
                        <Text style={styles.decline_btn_text}>Decline</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.accept_btn}
                        onPress={() => handleAcceptOrder(order.id)}
                      >
                        <Feather name="check" size={16} color="#121212" />
                        <Text style={styles.accept_btn_text}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {order.status === "preparing" && (
                    <TouchableOpacity
                      style={styles.search_driver_btn}
                      disabled={searchingMap[order.id]}
                      onPress={() => handleSearchForDriver(order.id)}
                    >
                      {searchingMap[order.id] ? (
                        <View style={styles.btn_loading_row}>
                          <ActivityIndicator size="small" color="#121212" />
                          <Text style={styles.search_driver_btn_text}>
                            Searching...
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.btn_loading_row}>
                          <FontAwesome5
                            name="search-location"
                            size={13}
                            color="#121212"
                          />
                          <Text style={styles.search_driver_btn_text}>
                            Search for Driver
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}

                  {(order.status === "ready_for_pickup" ||
                    order.status === "in_transit") &&
                    (() => {
                      const delivery = deliveriesMap[order.id];
                      const isSearching = searchingMap[order.id];
                      const isPaying = payingMap[order.id];

                      if (isSearching) {
                        return (
                          <TouchableOpacity
                            style={[styles.search_driver_btn, { opacity: 0.6 }]}
                            disabled
                          >
                            <View style={styles.btn_loading_row}>
                              <ActivityIndicator size="small" color="#121212" />
                              <Text style={styles.search_driver_btn_text}>
                                Searching...
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      if (delivery?.status === "expired") {
                        return (
                          <TouchableOpacity
                            style={styles.search_driver_btn}
                            onPress={() => handleRetryDriverSearch(order.id)}
                          >
                            <View style={styles.btn_loading_row}>
                              <Feather
                                name="refresh-cw"
                                size={13}
                                color="#121212"
                              />
                              <Text style={styles.search_driver_btn_text}>
                                Retry Driver Search
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      if (!delivery || delivery.status === "pending") {
                        return (
                          <TouchableOpacity
                            style={[styles.search_driver_btn, { opacity: 0.6 }]}
                            disabled
                          >
                            <View style={styles.btn_loading_row}>
                              <ActivityIndicator size="small" color="#121212" />
                              <Text style={styles.search_driver_btn_text}>
                                Searching for Driver...
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      if (delivery.driver) {
                        if (
                          delivery.status === "arrived" &&
                          delivery.payment_status !== "paid"
                        ) {
                          return (
                            <TouchableOpacity
                              style={styles.search_driver_btn}
                              disabled={isPaying}
                              onPress={() => handlePayRider(order.id)}
                            >
                              {isPaying ? (
                                <View style={styles.btn_loading_row}>
                                  <ActivityIndicator
                                    size="small"
                                    color="#121212"
                                  />
                                  <Text style={styles.search_driver_btn_text}>
                                    Paying Rider...
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.btn_loading_row}>
                                  <Feather
                                    name="credit-card"
                                    size={14}
                                    color="#121212"
                                  />
                                  <Text style={styles.search_driver_btn_text}>
                                    Pay Rider (₦1,500)
                                  </Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        }

                        if (delivery.payment_status === "paid") {
                          return (
                            <TouchableOpacity
                              style={[styles.search_driver_btn, { opacity: 0.6 }]}
                              disabled
                            >
                              <View style={styles.btn_loading_row}>
                                <Feather
                                  name="check-circle"
                                  size={14}
                                  color="#121212"
                                />
                                <Text style={styles.search_driver_btn_text}>
                                  Rider Paid (₦1,500)
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        }

                        return (
                          <TouchableOpacity
                            style={[styles.search_driver_btn, { opacity: 0.6 }]}
                            disabled
                          >
                            <View style={styles.btn_loading_row}>
                              <ActivityIndicator size="small" color="#121212" />
                              <Text style={styles.search_driver_btn_text}>
                                Rider En Route...
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      }

                      return null;
                    })()}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* ── Decline Order Reason Modal ── */}
      <Modal
        visible={declineModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeclineModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)" }}
        >
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.modal_backdrop}>
              <TouchableWithoutFeedback onPress={() => {}} accessible={false}>
                <View style={styles.modal_card}>
                  <Feather
                    name="x-circle"
                    size={32}
                    color="#ef5350"
                    style={{ alignSelf: "center", marginBottom: 8 }}
                  />
                  <Text style={[styles.modal_title, { textAlign: "center" }]}>
                    Decline Food Order
                  </Text>
                  <Text style={styles.modal_subtitle}>
                    Decline order #{declineTargetOrder?.order_number}? Customer
                    money will be automatically refunded to their wallet.
                  </Text>

                  <Text style={styles.input_label}>DECLINE REASON</Text>
                  <TextInput
                    style={[
                      styles.text_input,
                      { height: 80, textAlignVertical: "top" },
                    ]}
                    placeholder="e.g. Out of ingredients, Kitchen closed, Too busy"
                    placeholderTextColor="#666"
                    multiline
                    value={declineReason}
                    onChangeText={setDeclineReason}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />

                  <View style={styles.modal_footer}>
                    <TouchableOpacity
                      style={styles.modal_cancel_btn}
                      onPress={() => setDeclineModalVisible(false)}
                    >
                      <Text style={styles.modal_cancel_text}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.modal_delete_btn}
                      onPress={handleConfirmDecline}
                    >
                      <Text style={styles.modal_delete_btn_text}>
                        Decline & Refund
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Full Order Receipt & Details Modal Sheet ── */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View
          style={[
            styles.sheet_container,
            { paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20 },
          ]}
        >
          <View style={styles.sheet_header}>
            <TouchableOpacity
              style={styles.sheet_close_btn}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.sheet_title}>
              Order #{selectedOrder?.order_number}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {selectedOrder && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.sheet_scroll_content,
                {
                  paddingBottom:
                    Platform.OS === "ios" ? insets.bottom + 40 : 50,
                },
              ]}
            >
              {/* Receipt Summary Box */}
              <View style={styles.receipt_card}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text style={styles.receipt_section_title}>
                      CUSTOMER DETAILS
                    </Text>
                    <Text style={styles.receipt_customer_name}>
                      {selectedOrder.customer_name}
                    </Text>
                    <Text style={styles.receipt_customer_phone}>
                      {selectedOrder.customer_phone}
                    </Text>
                    <Text style={styles.receipt_address}>
                      {selectedOrder.delivery_address}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.driver_call_btn}
                    onPress={() => handleCallCustomer(selectedOrder.customer_phone)}
                  >
                    <Feather name="phone-call" size={15} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.receipt_divider} />

                <Text style={styles.receipt_section_title}>ORDERED ITEMS</Text>
                {selectedOrder.items.map((it, idx) => (
                  <View key={idx} style={styles.receipt_item_row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.receipt_item_name}>
                        {it.quantity}x {it.name}
                      </Text>
                      {it.selected_options?.map((o, oIdx) => (
                        <Text key={oIdx} style={styles.receipt_option_text}>
                          + {o.group_name}: {o.option_name} (+₦
                          {o.price_modifier})
                        </Text>
                      ))}
                      {it.special_instructions ? (
                        <Text style={styles.receipt_note_text}>
                          Note: "{it.special_instructions}"
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.receipt_item_price}>
                      ₦{it.item_total.toLocaleString()}
                    </Text>
                  </View>
                ))}

                <View style={styles.receipt_divider} />

                <Text style={styles.receipt_section_title}>
                  PAYMENT SUMMARY
                </Text>
                <View style={styles.receipt_calc_row}>
                  <Text style={styles.calc_label}>Subtotal</Text>
                  <Text style={styles.calc_val}>
                    ₦{selectedOrder.subtotal.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.receipt_calc_row}>
                  <Text style={styles.calc_label}>Flat Delivery Fee</Text>
                  <Text style={styles.calc_val}>
                    ₦{selectedOrder.delivery_fee.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.receipt_calc_row_total}>
                  <Text style={styles.calc_label_total}>
                    Total Paid (Wallet)
                  </Text>
                  <Text style={styles.calc_val_total}>
                    ₦{selectedOrder.total.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Driver Details Card in Modal Sheet */}
              {deliveriesMap[selectedOrder.id]?.driver && (
                <View style={styles.driver_card}>
                  <View style={styles.driver_avatar_wrapper}>
                    {deliveriesMap[selectedOrder.id].driver.user?.profile_pic ? (
                      <Image
                        source={{
                          uri: deliveriesMap[selectedOrder.id].driver.user
                            .profile_pic,
                        }}
                        style={styles.driver_avatar}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.driver_avatar_placeholder}>
                        <FontAwesome5
                          name="motorcycle"
                          size={16}
                          color="#4caf50"
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.driver_info_col}>
                    <View style={styles.driver_name_row}>
                      <Text style={styles.driver_name_text} numberOfLines={1}>
                        {deliveriesMap[selectedOrder.id].driver.user?.name ||
                          "Dispatch Rider"}
                      </Text>
                      <View style={styles.driver_rating_badge}>
                        <Feather name="star" size={10} color="#ffc107" />
                        <Text style={styles.driver_rating_text}>
                          {(
                            deliveriesMap[selectedOrder.id].driver.rating || 5.0
                          ).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.driver_sub_text} numberOfLines={1}>
                      {(
                        deliveriesMap[selectedOrder.id].driver.vehicle_type ||
                        "BIKE"
                      ).toUpperCase()}{" "}
                      DISPATCH •{" "}
                      {deliveriesMap[selectedOrder.id].driver.user?.phone ||
                        "+234 800 000 0000"}
                    </Text>

                    <Text style={styles.driver_notice_text}>
                      {deliveriesMap[selectedOrder.id].status === "arrived"
                        ? "Rider has arrived at your restaurant!"
                        : deliveriesMap[selectedOrder.id].status ===
                            "in_transit"
                          ? "Rider is delivering order to customer"
                          : "Rider on the way"}
                    </Text>
                  </View>

                  {/* 1-Tap Driver Call Button */}
                  <TouchableOpacity
                    style={styles.driver_call_btn}
                    onPress={() =>
                      handleCallCustomer(
                        deliveriesMap[selectedOrder.id].driver.user?.phone ||
                          "",
                      )
                    }
                  >
                    <Feather name="phone-call" size={15} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Status Timeline */}
              <View style={styles.timeline_card}>
                <Text style={styles.receipt_section_title}>ORDER TIMELINE</Text>
                <View style={styles.timeline_item}>
                  <View style={styles.timeline_dot_active} />
                  <Text style={styles.timeline_text}>
                    Placed at {selectedOrder.placed_at}
                  </Text>
                </View>
                {selectedOrder.preparing_at && (
                  <View style={styles.timeline_item}>
                    <View style={styles.timeline_dot_active} />
                    <Text style={styles.timeline_text}>
                      Preparing started at {selectedOrder.preparing_at}
                    </Text>
                  </View>
                )}
                {selectedOrder.ready_at && (
                  <View style={styles.timeline_item}>
                    <View style={styles.timeline_dot_active} />
                    <Text style={styles.timeline_text}>
                      Ready for pickup at {selectedOrder.ready_at}
                    </Text>
                  </View>
                )}
                {selectedOrder.in_transit_at && (
                  <View style={styles.timeline_item}>
                    <View style={styles.timeline_dot_active} />
                    <Text style={styles.timeline_text}>
                      Dispatched at {selectedOrder.in_transit_at}
                    </Text>
                  </View>
                )}
                {selectedOrder.delivered_at && (
                  <View style={styles.timeline_item}>
                    <View style={styles.timeline_dot_active} />
                    <Text style={styles.timeline_text}>
                      Delivered at {selectedOrder.delivered_at}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default RestaurantOrders;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  top_nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  nav_icon_btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  header_center: {
    alignItems: "center",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  header_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },
  live_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#4caf501f",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4caf5044",
  },
  live_badge_dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4caf50",
  },
  live_badge_text: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 10,
  },

  // Tabs
  tabs_wrapper: {
    marginBottom: 12,
  },
  tabs_container: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab_chip: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tab_chip_active: {
    backgroundColor: "#ffffff20",
    borderColor: "#fff",
  },
  tab_chip_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  tab_chip_text_active: {
    color: "#fff",
    fontFamily: "raleway-bold",
  },

  // Scroll Content
  scroll_content: {
    paddingHorizontal: 16,
    gap: 14,
  },

  // Urgent Alert Bar
  urgent_alert_bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffc1071c",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffc10744",
    gap: 10,
    marginBottom: 4,
  },
  urgent_pulse_dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffc107",
  },
  urgent_alert_title: {
    color: "#ffc107",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  urgent_alert_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },

  // Empty State
  empty_state: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  empty_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
    maxWidth: "80%",
  },

  // Order Card
  order_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  card_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  order_num_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  order_num_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  time_ago_text: {
    color: "#777",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },
  customer_name: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
    marginTop: 2,
  },
  status_chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  status_dot_small: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chip_placed: {
    backgroundColor: "#ffc1071c",
    borderColor: "#ffc10744",
  },
  chip_preparing: {
    backgroundColor: "#ff98001c",
    borderColor: "#ff980044",
  },
  chip_ready: {
    backgroundColor: "#2196f31c",
    borderColor: "#2196f344",
  },
  chip_transit: {
    backgroundColor: "#9c27b01c",
    borderColor: "#9c27b044",
  },
  chip_delivered: {
    backgroundColor: "#4caf501c",
    borderColor: "#4caf5044",
  },
  chip_cancelled: {
    backgroundColor: "#ef53501c",
    borderColor: "#ef535044",
  },
  status_chip_text: {
    fontFamily: "raleway-bold",
    fontSize: 11,
  },

  // Items Box
  items_box: {
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262626",
    gap: 8,
  },
  item_line: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  item_line_name: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  item_qty: {
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  item_options_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  instructions_box: {
    backgroundColor: "#ffc10712",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  instructions_text: {
    color: "#ffc107",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },
  item_line_price: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // Delivery & Call
  delivery_info_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  address_line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  address_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  landmark_text: {
    color: "#666",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
    marginLeft: 19,
  },
  call_btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },

  // Pricing & Footer Actions
  pricing_footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#262626",
  },
  total_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  total_price_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  action_group: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  decline_btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef535044",
  },
  decline_btn_text: {
    color: "#ef5350",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  accept_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  accept_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  ready_action_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  ready_action_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  awaiting_rider_tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2196f31f",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2196f344",
  },
  awaiting_rider_text: {
    color: "#2196f3",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },

  // Modal Backdrop
  modal_backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal_card: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  modal_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  modal_subtitle: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  input_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  text_input: {
    backgroundColor: "#121212",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },
  modal_footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  modal_cancel_btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_cancel_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  modal_delete_btn: {
    backgroundColor: "#ef5350",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_delete_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // Modal Sheet (Details)
  sheet_container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  sheet_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  sheet_close_btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  sheet_scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 16,
  },
  receipt_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  receipt_section_title: {
    color: "#777",
    fontFamily: "raleway-bold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  receipt_customer_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  receipt_customer_phone: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 12,
    marginTop: 2,
  },
  receipt_address: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 4,
  },
  receipt_divider: {
    height: 1,
    backgroundColor: "#262626",
    marginVertical: 14,
  },
  receipt_item_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  receipt_item_name: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  receipt_option_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  receipt_note_text: {
    color: "#ffc107",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  receipt_item_price: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  receipt_calc_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  calc_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  calc_val: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  receipt_calc_row_total: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  calc_label_total: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  calc_val_total: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  timeline_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  timeline_item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeline_dot_active: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  timeline_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 12,
  },

  // Driver Card & Rider Payment styles
  driver_card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f1f",
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  driver_avatar_wrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  driver_avatar: {
    width: "100%",
    height: "100%",
  },
  driver_avatar_placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  driver_info_col: {
    flex: 1,
    gap: 4,
  },
  driver_name_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driver_name_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    maxWidth: "70%",
  },
  driver_rating_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ffc1071e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  driver_rating_text: {
    color: "#ffc107",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  driver_sub_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },
  driver_notice_text: {
    color: "#4caf50",
    fontFamily: "raleway-semibold",
    fontSize: 11,
    marginTop: 2,
  },
  driver_call_btn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff1f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff33",
  },
  pay_rider_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4caf50",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 8,
    gap: 6,
  },
  pay_rider_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  paid_rider_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#4caf501c",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#4caf5044",
  },
  paid_rider_badge_text: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  search_driver_btn: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  search_driver_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  btn_loading_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
