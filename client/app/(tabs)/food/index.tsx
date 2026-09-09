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
import React, { useState, useEffect, useMemo } from "react";
import AppLoading from "../../../loadings/AppLoading";
import { useLoading } from "../../../context/LoadingContext";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  useFoodOrderContext,
  FoodOrderType,
} from "../../../context/FoodOrderContext";

// ─── Status color helper ──────────────────────────────────────────────────────

const getStatusColor = (status: string) => {
  switch (status) {
    case "placed":
      return { bg: "#ff9d003a", text: "#ff9d00", label: "Placed" };
    case "preparing":
      return { bg: "#ff9d003a", text: "#ff9d00", label: "Preparing" };
    case "ready_for_pickup":
      return { bg: "#2196f33a", text: "#2196f3", label: "Ready" };
    case "in_transit":
      return { bg: "#2196f33a", text: "#2196f3", label: "In Transit" };
    case "delivered":
      return { bg: "#4caf503a", text: "#4caf50", label: "Delivered" };
    case "cancelled":
    case "rejected":
      return { bg: "#f443363a", text: "#f44336", label: "Cancelled" };
    default:
      return { bg: "#ff9d003a", text: "#ff9d00", label: status };
  }
};

// ─── Root Component ───────────────────────────────────────────────────────────

const FoodRoot = () => {
  const insets = useSafeAreaInsets();
  const { appLoading } = useLoading();
  const { customerOrders, fetchCustomerOrders } = useFoodOrderContext();

  const [category, setCategory] = useState<"active" | "completed" | "cancelled">(
    "active"
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCustomerOrders();
    setRefreshing(false);
  };

  const activeOrders = useMemo(() => {
    return customerOrders.filter((o) =>
      ["placed", "preparing", "ready_for_pickup", "in_transit"].includes(o.status)
    );
  }, [customerOrders]);

  const completedOrders = useMemo(() => {
    return customerOrders.filter((o) => o.status === "delivered");
  }, [customerOrders]);

  const cancelledOrders = useMemo(() => {
    return customerOrders.filter((o) =>
      ["cancelled", "rejected"].includes(o.status)
    );
  }, [customerOrders]);

  const hasCancelled = cancelledOrders.length > 0;

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
              <ActiveOrderSection
                orders={activeOrders}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            )}

            {/* Completed Tab */}
            {category === "completed" && (
              <CompletedOrders
                data={completedOrders}
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            )}

            {/* Cancelled Tab */}
            {category === "cancelled" && (
              <CancelledOrders
                data={cancelledOrders}
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

// ─── Active Orders Section ────────────────────────────────────────────────────

const ActiveOrderSection = ({
  orders,
  refreshing,
  onRefresh,
}: {
  orders: FoodOrderType[];
  refreshing: boolean;
  onRefresh: () => void;
}) => {
  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        message="You don't have any active food orders"
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
      {orders.map((order) => {
        const statusColors = getStatusColor(order.status);
        const restaurantName =
          typeof order.restaurant === "object"
            ? order.restaurant.name
            : "Restaurant";
        const itemsSummary =
          order.items && order.items.length > 0
            ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
            : "Food order items";
        const total = order.pricing?.total
          ? `₦${order.pricing.total.toLocaleString()}`
          : "₦0";

        return (
          <View key={order._id} style={[styles.active_card, { marginBottom: 14 }]}>
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
                <Text style={styles.active_restaurant}>{restaurantName}</Text>
                <Text style={styles.active_items} numberOfLines={1}>
                  {itemsSummary}
                </Text>
              </View>
              <View
                style={[
                  styles.status_badge,
                  { backgroundColor: statusColors.bg },
                ]}
              >
                <Text
                  style={[styles.status_text, { color: statusColors.text }]}
                >
                  {statusColors.label}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Info row */}
            <View style={styles.active_info_row}>
              <View style={styles.active_info_item}>
                <Feather name="clock" size={13} color="#9CA3AF" />
                <Text style={styles.active_info_text}>20–35 min</Text>
              </View>
              <View style={styles.active_info_item}>
                <Feather name="credit-card" size={13} color="#9CA3AF" />
                <Text style={styles.active_info_text}>{total}</Text>
              </View>
            </View>

            {/* Track CTA */}
            <TouchableOpacity
              style={styles.track_btn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push({
                  pathname: "/food/track",
                  params: { id: order._id },
                });
              }}
            >
              <Text style={styles.track_btn_text}>Track Order</Text>
              <Feather name="arrow-right" size={14} color="#121212" />
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
};

// ─── Completed Orders ─────────────────────────────────────────────────────────

const CompletedOrders = ({
  data,
  refreshing,
  onRefresh,
}: {
  data: FoodOrderType[];
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
        const restaurantName =
          typeof order.restaurant === "object"
            ? order.restaurant.name
            : "Restaurant";
        const itemsSummary =
          order.items && order.items.length > 0
            ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
            : "Food order items";
        const total = order.pricing?.total
          ? `₦${order.pricing.total.toLocaleString()}`
          : "₦0";
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return (
          <TouchableOpacity
            key={order._id}
            style={styles.history_card}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/food/order/[id]",
                params: { id: order._id },
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
                  {restaurantName}
                </Text>
                <Text style={styles.history_items} numberOfLines={1}>
                  {itemsSummary}
                </Text>
                {dateStr ? (
                  <Text style={styles.history_date}>{dateStr}</Text>
                ) : null}
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
              <Text style={styles.history_total}>{total}</Text>
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
  data: FoodOrderType[];
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
        const restaurantName =
          typeof order.restaurant === "object"
            ? order.restaurant.name
            : "Restaurant";
        const itemsSummary =
          order.items && order.items.length > 0
            ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
            : "Food order items";
        const total = order.pricing?.total
          ? `₦${order.pricing.total.toLocaleString()}`
          : "₦0";
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";

        return (
          <TouchableOpacity
            key={order._id}
            style={styles.history_card}
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push({
                pathname: "/food/order/[id]",
                params: { id: order._id },
              });
            }}
          >
            <View style={styles.history_left}>
              <View
                style={[
                  styles.history_icon_box,
                  { backgroundColor: "#2a2a2a" },
                ]}
              >
                <Image
                  source={require("../../../assets/images/icons/food-icon-fill.png")}
                  style={{ width: 16, height: 16, tintColor: "#666" }}
                  contentFit="contain"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.history_restaurant}>
                  {restaurantName}
                </Text>
                <Text style={styles.history_items} numberOfLines={1}>
                  {itemsSummary}
                </Text>
                {dateStr ? (
                  <Text style={styles.history_date}>{dateStr}</Text>
                ) : null}
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
              <Text style={styles.history_total}>{total}</Text>
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
