import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import AppLoading from "../../../loadings/AppLoading";
import { useLoading } from "../../../context/LoadingContext";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ─── Dummy Data ───────────────────────────────────────────────────────────────

const DUMMY_ACTIVE_ORDER = {
  id: "fo_001",
  restaurant: "KFC Naija",
  items: "1x Zinger Burger, 2x Chips",
  status: "preparing",
  estimatedTime: "25–35 min",
  total: "₦5,200",
};

const DUMMY_COMPLETED_ORDERS = [
  {
    id: "fo_002",
    restaurant: "Pizza Palace",
    items: "1x Pepperoni Pizza (Large)",
    status: "delivered",
    date: "Aug 30, 2026",
    total: "₦8,500",
  },
  {
    id: "fo_003",
    restaurant: "Burger Barn",
    items: "2x Smash Burger, 1x Milkshake",
    status: "delivered",
    date: "Aug 27, 2026",
    total: "₦6,100",
  },
  {
    id: "fo_004",
    restaurant: "Mama's Kitchen",
    items: "1x Jollof Rice (Large), 1x Chicken",
    status: "delivered",
    date: "Aug 22, 2026",
    total: "₦4,300",
  },
];

const DUMMY_CANCELLED_ORDERS = [
  {
    id: "fo_005",
    restaurant: "Street Bites",
    items: "1x Shawarma, 1x Malt",
    status: "cancelled",
    date: "Aug 19, 2026",
    total: "₦3,700",
  },
];

// ─── Status color helper ──────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case "preparing":
    case "accepted":
      return { bg: "#ff9d003a", text: "#ff9d00" };
    case "on_the_way":
      return { bg: "#2196f33a", text: "#2196f3" };
    case "delivered":
      return { bg: "#4caf503a", text: "#4caf50" };
    case "cancelled":
      return { bg: "#f443363a", text: "#f44336" };
    default:
      return { bg: "#ff9d003a", text: "#ff9d00" };
  }
};

// ─── Root Component ───────────────────────────────────────────────────────────

const FoodRoot = () => {
  const insets = useSafeAreaInsets();
  const { appLoading } = useLoading();
  const [category, setCategory] = useState<"active" | "completed" | "cancelled">("active");
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // No-op for now — backend integration later
    setTimeout(() => setRefreshing(false), 800);
  };

  const hasCancelled = DUMMY_CANCELLED_ORDERS.length > 0;

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.header_text}>Food Orders</Text>

            {/* Category Tabs */}
            <CategoryTabs
              category={category}
              setCategory={setCategory}
              hasCancelled={hasCancelled}
            />

            {/* Active Tab */}
            {category === "active" && (
              <ActiveOrder
                order={DUMMY_ACTIVE_ORDER}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            )}

            {/* Completed Tab */}
            {category === "completed" && (
              <CompletedOrders
                data={DUMMY_COMPLETED_ORDERS}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            )}

            {/* Cancelled Tab */}
            {category === "cancelled" && (
              <CancelledOrders
                data={DUMMY_CANCELLED_ORDERS}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            )}
          </View>
        </>
      )}
    </>
  );
};

export default FoodRoot;

// ─── Category Tabs ────────────────────────────────────────────────────────────

const CategoryTabs = ({
  category,
  setCategory,
  hasCancelled,
}: {
  category: "active" | "completed" | "cancelled";
  setCategory: (cat: "active" | "completed" | "cancelled") => void;
  hasCancelled: boolean;
}) => {
  const tabs: Array<"active" | "completed" | "cancelled"> = [
    "active",
    "completed",
    ...(hasCancelled ? (["cancelled"] as const) : []),
  ];

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.nav_container}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setCategory(tab)}
            style={[styles.nav_box, category === tab && styles.nav_box_active]}
          >
            <Text
              style={[
                styles.nav_text,
                category === tab && styles.nav_text_active,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Active Order ─────────────────────────────────────────────────────────────

const ActiveOrder = ({
  order,
  refreshing,
  onRefresh,
}: {
  order: typeof DUMMY_ACTIVE_ORDER | null;
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  if (!order) {
    return (
      <EmptyState
        message="You don't have any active food orders"
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  const statusColors = getStatusColor(order.status);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scroll_content,
        Platform.OS === "ios" ? { paddingBottom: 100 } : { paddingBottom: 60 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
          colors={["#fff"]}
        />
      }
    >
      {/* Active order card */}
      <View style={styles.active_card}>
        {/* Header row */}
        <View style={styles.active_card_header}>
          <View style={styles.food_icon_box}>
            <Image
              source={require("../../../assets/images/icons/food-icon-fill.png")}
              style={{ width: 20, height: 20, tintColor: "#fff" }}
              contentFit="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.active_restaurant}>{order.restaurant}</Text>
            <Text style={styles.active_items} numberOfLines={1}>
              {order.items}
            </Text>
          </View>
          <View
            style={[
              styles.status_badge,
              { backgroundColor: statusColors.bg },
            ]}
          >
            <Text style={[styles.status_text, { color: statusColors.text }]}>
              {order.status === "preparing" ? "Preparing" : order.status}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info row */}
        <View style={styles.active_info_row}>
          <View style={styles.active_info_item}>
            <Feather name="clock" size={13} color="#9CA3AF" />
            <Text style={styles.active_info_text}>{order.estimatedTime}</Text>
          </View>
          <View style={styles.active_info_item}>
            <Feather name="credit-card" size={13} color="#9CA3AF" />
            <Text style={styles.active_info_text}>{order.total}</Text>
          </View>
        </View>

        {/* Track CTA */}
        <TouchableOpacity
          style={styles.track_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/food/track");
          }}
        >
          <Text style={styles.track_btn_text}>Track Order</Text>
          <Feather name="arrow-right" size={14} color="#121212" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── Completed Orders ─────────────────────────────────────────────────────────

const CompletedOrders = ({
  data,
  refreshing,
  onRefresh,
}: {
  data: typeof DUMMY_COMPLETED_ORDERS;
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        message="You haven't completed any food orders yet"
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scroll_content,
        Platform.OS === "ios" ? { paddingBottom: 100 } : { paddingBottom: 60 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
          colors={["#fff"]}
        />
      }
    >
      {data.map((order) => {
        const statusColors = getStatusColor(order.status);
        return (
          <TouchableOpacity
            key={order.id}
            style={styles.history_card}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/food/order/[id]",
                params: { id: order.id },
              });
            }}
          >
            <View style={styles.history_left}>
              <View style={styles.history_icon_box}>
                <Image
                  source={require("../../../assets/images/icons/food-icon-fill.png")}
                  style={{ width: 16, height: 16, tintColor: "#fff" }}
                  contentFit="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.history_restaurant}>
                  {order.restaurant}
                </Text>
                <Text style={styles.history_items} numberOfLines={1}>
                  {order.items}
                </Text>
                <Text style={styles.history_date}>{order.date}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View
                style={[
                  styles.status_badge,
                  { backgroundColor: statusColors.bg },
                ]}
              >
                <Text
                  style={[styles.status_text, { color: statusColors.text }]}
                >
                  Delivered
                </Text>
              </View>
              <Text style={styles.history_total}>{order.total}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ─── Cancelled Orders ─────────────────────────────────────────────────────────

const CancelledOrders = ({
  data,
  refreshing,
  onRefresh,
}: {
  data: typeof DUMMY_CANCELLED_ORDERS;
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  if (!data || data.length === 0) {
    return (
      <EmptyState
        message="You don't have any cancelled food orders"
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scroll_content,
        Platform.OS === "ios" ? { paddingBottom: 100 } : { paddingBottom: 60 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
          colors={["#fff"]}
        />
      }
    >
      {data.map((order) => {
        const statusColors = getStatusColor(order.status);
        return (
          <TouchableOpacity
            key={order.id}
            style={styles.history_card}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/food/order/[id]",
                params: { id: order.id },
              });
            }}
          >
            <View style={styles.history_left}>
              <View style={[styles.history_icon_box, { backgroundColor: "#2a2a2a" }]}>
                <Image
                  source={require("../../../assets/images/icons/food-icon-fill.png")}
                  style={{ width: 16, height: 16, tintColor: "#666" }}
                  contentFit="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.history_restaurant}>
                  {order.restaurant}
                </Text>
                <Text style={styles.history_items} numberOfLines={1}>
                  {order.items}
                </Text>
                <Text style={styles.history_date}>{order.date}</Text>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View
                style={[
                  styles.status_badge,
                  { backgroundColor: statusColors.bg },
                ]}
              >
                <Text
                  style={[styles.status_text, { color: statusColors.text }]}
                >
                  Cancelled
                </Text>
              </View>
              <Text style={styles.history_total}>{order.total}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({
  message,
  refreshing,
  onRefresh,
}: {
  message: string;
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.empty_container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#fff"
          colors={["#fff"]}
        />
      }
    >
      <Image
        source={require("../../../assets/images/icons/food-icon.png")}
        style={styles.empty_icon}
        contentFit="contain"
      />
      <Text style={styles.empty_title}>No orders yet</Text>
      <Text style={styles.empty_message}>{message}</Text>
      <TouchableOpacity
        style={styles.order_btn}
        onPress={() => router.push("../../(book)/food")}
      >
        <Text style={styles.order_btn_text}>Order Food</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header_text: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "raleway-bold",
    fontSize: 32,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  // Category tabs
  nav_container: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 8,
  },
  nav_box: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  nav_box_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  nav_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  nav_text_active: {
    color: "#121212",
  },
  scroll_content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  // Active order card
  active_card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  active_card_header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  food_icon_box: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ff9d00",
    alignItems: "center",
    justifyContent: "center",
  },
  active_restaurant: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  active_items: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 2,
  },
  status_badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  status_text: {
    fontFamily: "raleway-bold",
    fontSize: 10,
    textTransform: "capitalize",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 14,
  },
  active_info_row: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 16,
  },
  active_info_item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  active_info_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  track_btn: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  track_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  // History card
  history_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  history_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  history_icon_box: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#ff9d0022",
    alignItems: "center",
    justifyContent: "center",
  },
  history_restaurant: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  history_items: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
    maxWidth: 180,
  },
  history_date: {
    color: "#555",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 3,
  },
  history_total: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  // Empty state
  empty_container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  empty_icon: {
    width: 90,
    height: 90,
    tintColor: "#333",
    marginBottom: 20,
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 20,
    marginBottom: 8,
  },
  empty_message: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  order_btn: {
    backgroundColor: "#fff",
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  order_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
});
