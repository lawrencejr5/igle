import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import React from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Dummy Order Details Store ────────────────────────────────────────────────

export interface OrderDetail {
  id: string;
  restaurantId: string;
  restaurantName: string;
  restaurantAddress: string;
  status: "delivered" | "cancelled" | "preparing";
  date: string;
  deliveredTime?: string;
  cancelledReason?: string;
  deliveryAddress: string;
  riderName: string;
  riderRating: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  paymentMethod: string;
}

const ORDERS_STORE: Record<string, OrderDetail> = {
  fo_002: {
    id: "fo_002",
    restaurantId: "1",
    restaurantName: "Pizza Palace",
    restaurantAddress: "12 Marina Boulevard, Victoria Island",
    status: "delivered",
    date: "Aug 30, 2026",
    deliveredTime: "2:15 PM",
    deliveryAddress: "12 Marina Boulevard, Victoria Island, Lagos",
    riderName: "Emmanuel Okafor",
    riderRating: "4.9 ★",
    items: [
      { name: "Pepperoni Feast Pizza (Large)", qty: 1, price: 6500 },
      { name: "Garlic Butter Breadsticks", qty: 1, price: 2000 },
    ],
    subtotal: 8500,
    deliveryFee: 600,
    serviceFee: 200,
    total: 9300,
    paymentMethod: "Igle Wallet",
  },
  fo_003: {
    id: "fo_003",
    restaurantId: "2",
    restaurantName: "Burger Barn",
    restaurantAddress: "45 Admiralty Way, Lekki Phase 1",
    status: "delivered",
    date: "Aug 27, 2026",
    deliveredTime: "7:45 PM",
    deliveryAddress: "12 Marina Boulevard, Victoria Island, Lagos",
    riderName: "Tunde Bakare",
    riderRating: "4.8 ★",
    items: [
      { name: "Smash Burger & Fries", qty: 2, price: 4600 },
      { name: "Chocolate Milkshake", qty: 1, price: 1500 },
    ],
    subtotal: 6100,
    deliveryFee: 500,
    serviceFee: 200,
    total: 6800,
    paymentMethod: "Igle Wallet",
  },
  fo_004: {
    id: "fo_004",
    restaurantId: "5",
    restaurantName: "Mama's Kitchen",
    restaurantAddress: "88 Isaac John Street, Ikeja GRA",
    status: "delivered",
    date: "Aug 22, 2026",
    deliveredTime: "1:30 PM",
    deliveryAddress: "12 Marina Boulevard, Victoria Island, Lagos",
    riderName: "Chidi Nnamdi",
    riderRating: "5.0 ★",
    items: [
      { name: "Special Jollof Rice (Large)", qty: 1, price: 2800 },
      { name: "Grilled Chicken Quarter", qty: 1, price: 1500 },
    ],
    subtotal: 4300,
    deliveryFee: 400,
    serviceFee: 150,
    total: 4850,
    paymentMethod: "Igle Wallet",
  },
  fo_005: {
    id: "fo_005",
    restaurantId: "6",
    restaurantName: "Street Bites",
    restaurantAddress: "21 Commercial Avenue, Yaba",
    status: "cancelled",
    date: "Aug 19, 2026",
    cancelledReason: "Store unavailable / item out of stock",
    deliveryAddress: "12 Marina Boulevard, Victoria Island, Lagos",
    riderName: "Unassigned",
    riderRating: "N/A",
    items: [
      { name: "Chicken Shawarma (Extra Cheese)", qty: 1, price: 2700 },
      { name: "Ice Cold Malt Can", qty: 1, price: 1000 },
    ],
    subtotal: 3700,
    deliveryFee: 400,
    serviceFee: 150,
    total: 4250,
    paymentMethod: "Igle Wallet (Refunded)",
  },
};

// ─── Single Order Screen Component ────────────────────────────────────────────

const FoodOrderDetail = () => {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fallback order data if invalid ID
  const order = ORDERS_STORE[id || "fo_002"] || ORDERS_STORE["fo_002"];
  const isDelivered = order.status === "delivered";

  const handleReorder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/(book)/restaurant/[id]",
      params: { id: order.restaurantId },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "ios" ? insets.top : insets.top + 10 }]}>
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
          <Text style={styles.header_id}>#{order.id.toUpperCase()}</Text>
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
            isDelivered ? styles.status_banner_delivered : styles.status_banner_cancelled,
          ]}
        >
          <View
            style={[
              styles.status_icon_box,
              isDelivered ? styles.status_icon_delivered : styles.status_icon_cancelled,
            ]}
          >
            <Feather
              name={isDelivered ? "check" : "x"}
              size={16}
              color={isDelivered ? "#4caf50" : "#f44336"}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.status_title,
                { color: isDelivered ? "#4caf50" : "#f44336" },
              ]}
            >
              {isDelivered ? "Order Delivered" : "Order Cancelled"}
            </Text>
            <Text style={styles.status_subtitle}>
              {isDelivered
                ? `${order.date} · ${order.deliveredTime}`
                : `${order.date} · ${order.cancelledReason}`}
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
              <Text style={styles.restaurant_name}>{order.restaurantName}</Text>
              <Text style={styles.restaurant_address}>{order.restaurantAddress}</Text>
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
              <View style={styles.item_qty_pill}>
                <Text style={styles.item_qty_text}>{item.qty}x</Text>
              </View>
              <Text style={styles.item_name}>{item.name}</Text>
              <Text style={styles.item_price}>₦{item.price.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* ── Payment Summary Card ── */}
        <View style={styles.card}>
          <Text style={styles.section_subtitle}>Payment Summary</Text>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Subtotal</Text>
            <Text style={styles.breakdown_val}>₦{order.subtotal.toLocaleString()}</Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Delivery Fee</Text>
            <Text style={styles.breakdown_val}>₦{order.deliveryFee.toLocaleString()}</Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Service Fee</Text>
            <Text style={styles.breakdown_val}>₦{order.serviceFee.toLocaleString()}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.total_row}>
            <Text style={styles.total_label}>
              {isDelivered ? "Total Paid" : "Refund Amount"}
            </Text>
            <Text style={styles.total_val}>₦{order.total.toLocaleString()}</Text>
          </View>

          <View style={styles.payment_method_tag}>
            <Feather name="credit-card" size={13} color="#9CA3AF" />
            <Text style={styles.payment_method_text}>
              {order.paymentMethod}
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
              <Text style={styles.info_val}>{order.deliveryAddress}</Text>
            </View>
          </View>

          {isDelivered && (
            <View style={[styles.info_row, { marginTop: 12 }]}>
              <Feather name="user" size={15} color="#9CA3AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.info_label}>Delivered By</Text>
                <Text style={styles.info_val}>
                  {order.riderName} ({order.riderRating})
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Bottom Actions ── */}
        <View style={styles.actions_container}>
          <TouchableOpacity style={styles.primary_btn} onPress={handleReorder}>
            <Feather name="refresh-cw" size={15} color="#121212" />
            <Text style={styles.primary_btn_text}>
              {isDelivered ? "Reorder Items" : "Order Again"}
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
    marginBottom: 8,
    gap: 10,
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
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
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
