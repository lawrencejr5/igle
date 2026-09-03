import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import SideNav from "../../../components/SideNav";

// ─── Dummy Live Vendor Orders ──────────────────────────────────────────────────

interface VendorOrder {
  id: string;
  customerName: string;
  items: string;
  total: string;
  time: string;
  status: "new" | "preparing" | "ready" | "in_transit";
}

const INITIAL_VENDOR_ORDERS: VendorOrder[] = [
  {
    id: "FO-98241",
    customerName: "Alex Johnson",
    items: "2x Pepperoni Feast Pizza, 1x Garlic Breadsticks",
    total: "₦8,500",
    time: "2 mins ago",
    status: "new",
  },
  {
    id: "FO-98240",
    customerName: "Sarah Williams",
    items: "1x Four Cheese Supreme Pizza",
    total: "₦7,200",
    time: "10 mins ago",
    status: "preparing",
  },
  {
    id: "FO-98238",
    customerName: "David O. Kayode",
    items: "1x Cheesy Meatballs & Sauce, 1x Coke",
    total: "₦4,300",
    time: "22 mins ago",
    status: "in_transit",
  },
];

// ─── Restaurant Dashboard Screen ──────────────────────────────────────────────

const RestaurantHome = () => {
  const insets = useSafeAreaInsets();
  const [isStoreOnline, setIsStoreOnline] = useState(true);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [orders, setOrders] = useState<VendorOrder[]>(INITIAL_VENDOR_ORDERS);

  const toggleOnlineStatus = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStoreOnline((prev) => !prev);
  };

  const handleUpdateOrderStatus = (orderId: string, nextStatus: VendorOrder["status"]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: nextStatus } : ord))
    );
  };

  const handleSwitchToRiderMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)/home");
  };

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14 },
        ]}
      >
        {/* ── Top Nav Bar ── */}
        <View style={styles.top_nav}>
          <TouchableOpacity
            style={styles.menu_btn}
            onPress={() => setSideNavOpen(true)}
          >
            <Feather name="menu" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.header_center}>
            <Text style={styles.store_title}>Pizza Palace</Text>
            <Text style={styles.store_subtitle}>Vendor Dashboard</Text>
          </View>

          <TouchableOpacity
            style={styles.switch_rider_btn}
            onPress={handleSwitchToRiderMode}
          >
            <Feather name="user" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scroll_content,
            { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
          ]}
        >
          {/* ── Store Online Status Card ── */}
          <View
            style={[
              styles.status_banner,
              isStoreOnline ? styles.status_online : styles.status_offline,
            ]}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.status_title_row}>
                <View
                  style={[
                    styles.status_dot,
                    { backgroundColor: isStoreOnline ? "#4caf50" : "#9CA3AF" },
                  ]}
                />
                <Text style={styles.status_title_text}>
                  {isStoreOnline ? "Store is Online" : "Store is Offline"}
                </Text>
              </View>
              <Text style={styles.status_desc_text}>
                {isStoreOnline
                  ? "Accepting incoming customer food orders"
                  : "Paused — customers cannot place new orders"}
              </Text>
            </View>

            <Switch
              value={isStoreOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: "#333", true: "#4caf5055" }}
              thumbColor={isStoreOnline ? "#4caf50" : "#9CA3AF"}
            />
          </View>

          {/* ── Metrics Summary Grid ── */}
          <View style={styles.metrics_grid}>
            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>TODAY'S REVENUE</Text>
              <Text style={styles.metric_value}>₦48,500</Text>
              <Text style={styles.metric_sub_green}>↑ 14% vs yesterday</Text>
            </View>

            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>ACTIVE ORDERS</Text>
              <Text style={styles.metric_value}>{orders.length}</Text>
              <Text style={styles.metric_sub_gray}>In queue</Text>
            </View>

            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>COMPLETED</Text>
              <Text style={styles.metric_value}>14</Text>
              <Text style={styles.metric_sub_gray}>Orders today</Text>
            </View>

            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>STORE RATING</Text>
              <Text style={styles.metric_value}>4.9 ★</Text>
              <Text style={styles.metric_sub_gray}>Based on 320 ratings</Text>
            </View>
          </View>

          {/* ── Live Orders Section ── */}
          <View style={styles.section}>
            <View style={styles.section_header}>
              <Text style={styles.section_title}>Live Orders</Text>
              <View style={styles.badge_count}>
                <Text style={styles.badge_count_text}>{orders.length}</Text>
              </View>
            </View>

            {orders.map((order) => {
              return (
                <View key={order.id} style={styles.order_card}>
                  <View style={styles.order_header_row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.order_id_text}>{order.id}</Text>
                      <Text style={styles.customer_name}>{order.customerName}</Text>
                    </View>
                    <Text style={styles.order_price_text}>{order.total}</Text>
                  </View>

                  <Text style={styles.order_items_text}>{order.items}</Text>

                  <View style={styles.order_footer_row}>
                    <Text style={styles.order_time_text}>⏱ {order.time}</Text>

                    {/* Dynamic Action Button based on Order Status */}
                    {order.status === "new" && (
                      <View style={styles.action_btn_group}>
                        <TouchableOpacity
                          style={styles.accept_btn}
                          onPress={() => handleUpdateOrderStatus(order.id, "preparing")}
                        >
                          <Feather name="check" size={14} color="#121212" />
                          <Text style={styles.accept_btn_text}>Accept</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {order.status === "preparing" && (
                      <TouchableOpacity
                        style={styles.ready_btn}
                        onPress={() => handleUpdateOrderStatus(order.id, "in_transit")}
                      >
                        <Feather name="package" size={14} color="#fff" />
                        <Text style={styles.ready_btn_text}>Mark Ready</Text>
                      </TouchableOpacity>
                    )}

                    {order.status === "in_transit" && (
                      <View style={styles.transit_tag}>
                        <Feather name="truck" size={12} color="#2196f3" />
                        <Text style={styles.transit_tag_text}>Dispatched</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Quick Vendor Tools ── */}
          <View style={styles.section}>
            <Text style={styles.section_title}>Vendor Management</Text>

            <View style={styles.tools_grid}>
              <TouchableOpacity style={styles.tool_card}>
                <View style={styles.tool_icon_box}>
                  <Feather name="list" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Menu Catalog</Text>
                <Text style={styles.tool_sub}>Edit items & prices</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tool_card}>
                <View style={styles.tool_icon_box}>
                  <Feather name="dollar-sign" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Payouts & Sales</Text>
                <Text style={styles.tool_sub}>View daily earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tool_card}>
                <View style={styles.tool_icon_box}>
                  <Feather name="clock" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Store Hours</Text>
                <Text style={styles.tool_sub}>Set opening times</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.tool_card} onPress={handleSwitchToRiderMode}>
                <View style={styles.tool_icon_box}>
                  <Feather name="user" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Rider Mode</Text>
                <Text style={styles.tool_sub}>Return to customer app</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* SideNav Drawer */}
      <SideNav
        mode="rider"
        open={sideNavOpen}
        setSideNavOpen={setSideNavOpen}
      />
    </>
  );
};

export default RestaurantHome;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Top Nav
  top_nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  menu_btn: {
    width: 42,
    height: 42,
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
  store_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  store_subtitle: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },
  switch_rider_btn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 16,
  },
  // Status banner
  status_banner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  status_online: {
    backgroundColor: "#4caf5015",
    borderColor: "#4caf503a",
  },
  status_offline: {
    backgroundColor: "#1a1a1a",
    borderColor: "#2a2a2a",
  },
  status_title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  status_dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status_title_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  status_desc_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  // Metrics Grid
  metrics_grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metric_card: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  metric_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  metric_value: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 4,
  },
  metric_sub_green: {
    color: "#4caf50",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },
  metric_sub_gray: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
  // Section
  section: {
    gap: 12,
  },
  section_header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  badge_count: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badge_count_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  // Live order card
  order_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  order_header_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  order_id_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  customer_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  order_price_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  order_items_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  order_footer_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  order_time_text: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  action_btn_group: {
    flexDirection: "row",
    gap: 8,
  },
  accept_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  accept_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  ready_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  ready_btn_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  transit_tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2196f31f",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2196f344",
  },
  transit_tag_text: {
    color: "#2196f3",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  // Vendor Tools
  tools_grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tool_card: {
    width: "48%",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tool_icon_box: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tool_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginBottom: 2,
  },
  tool_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },
});
