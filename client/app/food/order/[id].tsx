import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useFoodOrderContext,
  FoodOrderType,
} from "../../../context/FoodOrderContext";
import AppLoading from "../../../loadings/AppLoading";

// ─── Status banner configuration ──────────────────────────────────────────────

const getStatusConfig = (status: string) => {
  switch (status) {
    case "delivered":
      return {
        isDelivered: true,
        isCancelled: false,
        title: "Order Delivered",
        bg: "#4caf5015",
        border: "#4caf503a",
        iconBg: "#4caf502a",
        iconColor: "#4caf50",
        iconName: "check" as const,
      };
    case "cancelled":
    case "rejected":
      return {
        isDelivered: false,
        isCancelled: true,
        title: "Order Cancelled",
        bg: "#f4433615",
        border: "#f443363a",
        iconBg: "#f443362a",
        iconColor: "#f44336",
        iconName: "x" as const,
      };
    case "ready_for_pickup":
    case "in_transit":
      return {
        isDelivered: false,
        isCancelled: false,
        title: status === "in_transit" ? "Order In Transit" : "Ready for Pickup",
        bg: "#2196f315",
        border: "#2196f33a",
        iconBg: "#2196f32a",
        iconColor: "#2196f3",
        iconName: "truck" as const,
      };
    case "placed":
    case "preparing":
    default:
      return {
        isDelivered: false,
        isCancelled: false,
        title: status === "preparing" ? "Preparing Your Order" : "Order Placed",
        bg: "#ff9d0015",
        border: "#ff9d003a",
        iconBg: "#ff9d002a",
        iconColor: "#ff9d00",
        iconName: "clock" as const,
      };
  }
};

// ─── Single Order Screen Component ────────────────────────────────────────────

const FoodOrderDetail = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { customerOrders, fetchOrderById } = useFoodOrderContext();

  const [order, setOrder] = useState<FoodOrderType | null>(() => {
    return customerOrders.find((o) => o._id === id) || null;
  });
  const [fetching, setFetching] = useState<boolean>(!order);

  useEffect(() => {
    if (id) {
      fetchOrderById(id as string).then((res) => {
        if (res) {
          setOrder(res);
        }
        setFetching(false);
      });
    } else {
      setFetching(false);
    }
  }, [id]);

  if (fetching) {
    return <AppLoading />;
  }

  if (!order) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 10,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          },
        ]}
      >
        <Feather name="alert-circle" size={48} color="#f44336" />
        <Text
          style={{
            color: "#fff",
            fontFamily: "raleway-bold",
            fontSize: 18,
            marginTop: 12,
          }}
        >
          Order Not Found
        </Text>
        <Text
          style={{
            color: "#9CA3AF",
            fontFamily: "raleway-regular",
            fontSize: 13,
            textAlign: "center",
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          We couldn't find the requested food order.
        </Text>
        <TouchableOpacity
          style={styles.primary_btn}
          onPress={() => router.back()}
        >
          <Text style={styles.primary_btn_text}>Back to Orders</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const restaurantName =
    typeof order.restaurant === "object"
      ? order.restaurant?.name
      : order.restaurant_address?.name || "Restaurant";
  const restaurantAddress = order.restaurant_address?.address || "N/A";
  const restaurantId =
    typeof order.restaurant === "object"
      ? order.restaurant?._id
      : order.restaurant;

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const deliveredTime = order.status_timestamps?.delivered_at
    ? new Date(order.status_timestamps.delivered_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  const handleReorder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (restaurantId) {
      router.push({
        pathname: "/(book)/restaurant/[id]",
        params: { id: restaurantId },
      });
    } else {
      router.push("/(tabs)/food");
    }
  };

  const riderName =
    typeof order.driver === "object" && order.driver?.name
      ? order.driver.name
      : null;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 10 },
      ]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.back_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={25} color="#fff" />
        </Pressable>
        <View style={{ alignItems: "center" }}>
          <Text style={styles.header_title}>Order Details</Text>
          <Text style={styles.header_id}>
            #{order.order_number || order._id.slice(-6).toUpperCase()}
          </Text>
        </View>
        <View style={{ width: 45 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
        ]}
      >
        {/* ── Status Banner Card ── */}
        <View
          style={[
            styles.status_banner,
            {
              backgroundColor: statusConfig.bg,
              borderColor: statusConfig.border,
            },
          ]}
        >
          <View
            style={[
              styles.status_icon_box,
              { backgroundColor: statusConfig.iconBg },
            ]}
          >
            <Feather
              name={statusConfig.iconName}
              size={16}
              color={statusConfig.iconColor}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.status_title,
                { color: statusConfig.iconColor },
              ]}
            >
              {statusConfig.title}
            </Text>
            <Text style={styles.status_subtitle}>
              {statusConfig.isDelivered
                ? `${orderDate} ${deliveredTime ? `· ${deliveredTime}` : ""}`
                : statusConfig.isCancelled
                ? `${orderDate} · ${order.cancellation?.reason || "Order cancelled"}`
                : `${orderDate} · ${order.status.replace("_", " ").toUpperCase()}`}
            </Text>
          </View>
        </View>

        {/* ── Restaurant Card ── */}
        <View style={styles.card}>
          <View style={styles.card_header_row}>
            <View style={styles.restaurant_icon_box}>
              <Image
                source={require("../../../assets/images/icons/food-icon-fill.png")}
                style={{ width: 18, height: 18, tintColor: "#fff" }}
                contentFit="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurant_name}>{restaurantName}</Text>
              <Text style={styles.restaurant_address}>{restaurantAddress}</Text>
            </View>
            <TouchableOpacity style={styles.reorder_badge_btn} onPress={handleReorder}>
              <Text style={styles.reorder_badge_text}>Visit</Text>
              <Feather name="chevron-right" size={12} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Items Purchased List */}
          <Text style={styles.section_subtitle}>Items Ordered</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.item_row}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.item_image}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.item_image_placeholder}>
                  <Image
                    source={require("../../../assets/images/icons/food-icon-fill.png")}
                    style={{ width: 18, height: 18, tintColor: "#777" }}
                    contentFit="contain"
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.item_name}>{item.name}</Text>
                {item.selected_options && item.selected_options.length > 0 && (
                  <Text style={styles.item_options}>
                    {item.selected_options.map((o) => o.option_name).join(", ")}
                  </Text>
                )}
              </View>
              <View style={styles.item_qty_pill}>
                <Text style={styles.item_qty_text}>{item.quantity}x</Text>
              </View>
              <Text style={styles.item_price}>
                ₦{(item.item_total || item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Payment Summary Card ── */}
        <View style={styles.card}>
          <Text style={styles.section_subtitle}>Payment Summary</Text>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Subtotal</Text>
            <Text style={styles.breakdown_val}>
              ₦{(order.pricing?.subtotal || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Delivery Fee</Text>
            <Text style={styles.breakdown_val}>
              ₦{(order.pricing?.delivery_fee || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Service Fee</Text>
            <Text style={styles.breakdown_val}>
              ₦{(order.pricing?.service_fee || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.total_row}>
            <Text style={styles.total_label}>
              {statusConfig.isCancelled ? "Refund Amount" : "Total Paid"}
            </Text>
            <Text style={styles.total_val}>
              ₦{(order.pricing?.total || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.payment_method_tag}>
            <Feather name="credit-card" size={13} color="#9CA3AF" />
            <Text style={styles.payment_method_text}>
              {(order.payment?.method || "Wallet").toUpperCase()}
              {order.payment?.status === "refunded" ? " (Refunded)" : ""}
            </Text>
          </View>
        </View>

        {/* ── Delivery Info Card ── */}
        <View style={styles.card}>
          <Text style={styles.section_subtitle}>Delivery Information</Text>

          <View style={styles.info_row}>
            <Feather name="map-pin" size={15} color="#9CA3AF" />
            <View style={{ flex: 1 }}>
              <Text style={styles.info_label}>Delivery Address</Text>
              <Text style={styles.info_val}>
                {order.delivery_address?.address || "N/A"}
              </Text>
            </View>
          </View>

          {riderName && (
            <View style={[styles.info_row, { marginTop: 12 }]}>
              <Feather name="user" size={15} color="#9CA3AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.info_label}>Delivered By</Text>
                <Text style={styles.info_val}>{riderName}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Bottom Actions ── */}
        <View style={styles.actions_container}>
          <TouchableOpacity style={styles.primary_btn} onPress={handleReorder}>
            <Feather name="refresh-cw" size={15} color="#121212" />
            <Text style={styles.primary_btn_text}>
              {statusConfig.isDelivered ? "Reorder Items" : "Visit Store"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondary_btn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Feather name="help-circle" size={15} color="#fff" />
            <Text style={styles.secondary_btn_text}>Need Help?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default FoodOrderDetail;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back_btn: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  header_id: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 11,
    marginTop: 1,
  },
  // Content
  scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  // Status Banner
  status_banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  status_banner_delivered: {
    backgroundColor: "#4caf5015",
    borderColor: "#4caf503a",
  },
  status_banner_cancelled: {
    backgroundColor: "#f4433615",
    borderColor: "#f443363a",
  },
  status_icon_box: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  status_icon_delivered: {
    backgroundColor: "#4caf502a",
  },
  status_icon_cancelled: {
    backgroundColor: "#f443362a",
  },
  status_title: {
    fontFamily: "raleway-bold",
    fontSize: 15,
    marginBottom: 2,
  },
  status_subtitle: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  // Card
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  card_header_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  restaurant_icon_box: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurant_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  restaurant_address: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  reorder_badge_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reorder_badge_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 12,
  },
  section_subtitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginBottom: 10,
  },
  // Items
  item_row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  item_image: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
  },
  item_image_placeholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  item_qty_pill: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  item_qty_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  item_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  item_options: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  item_price: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  // Breakdown
  breakdown_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  breakdown_label: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  breakdown_val: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  total_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  total_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  total_val: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  payment_method_tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  payment_method_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  // Delivery Info
  info_row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  info_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  info_val: {
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  // Actions
  actions_container: {
    gap: 10,
    marginTop: 6,
  },
  primary_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primary_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  secondary_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  secondary_btn_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
});
