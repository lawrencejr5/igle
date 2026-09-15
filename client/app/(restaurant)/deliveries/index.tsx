import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFoodOrderContext } from "../../../context/FoodOrderContext";

type DeliveryTab = "active" | "delivered" | "cancelled";

const RestaurantDeliveries = () => {
  const insets = useSafeAreaInsets();
  const { fetchRestaurantDeliveries, payDeliveryRider } = useFoodOrderContext();

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<DeliveryTab>("active");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payingMap, setPayingMap] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      const list = await fetchRestaurantDeliveries();
      setDeliveries(list);
    } catch (e) {
      console.log("Error loading deliveries:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePayRider = async (foodOrderId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayingMap((prev) => ({ ...prev, [foodOrderId]: true }));
    try {
      const ok = await payDeliveryRider(foodOrderId);
      if (ok) {
        loadData();
      }
    } finally {
      setPayingMap((prev) => ({ ...prev, [foodOrderId]: false }));
    }
  };

  const filteredDeliveries = React.useMemo(() => {
    return deliveries.filter((d) => {
      if (activeTab === "active") {
        return [
          "pending",
          "scheduled",
          "accepted",
          "arrived",
          "picked_up",
          "in_transit",
        ].includes(d.status);
      }
      if (activeTab === "delivered") {
        return d.status === "delivered";
      }
      if (activeTab === "cancelled") {
        return ["cancelled", "expired", "failed"].includes(d.status);
      }
      return true;
    });
  }, [deliveries, activeTab]);

  const activeCount = deliveries.filter((d) =>
    [
      "pending",
      "scheduled",
      "accepted",
      "arrived",
      "picked_up",
      "in_transit",
    ].includes(d.status),
  ).length;

  const deliveredCount = deliveries.filter(
    (d) => d.status === "delivered",
  ).length;
  const cancelledCount = deliveries.filter((d) =>
    ["cancelled", "expired", "failed"].includes(d.status),
  ).length;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14,
        },
      ]}
    >
      {/* ── Top Header Bar ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.back_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header_title_box}>
          <Text style={styles.header_title}>Restaurant Deliveries</Text>
          <Text style={styles.header_sub}>
            Manage dispatch riders & tracking
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refresh_btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRefresh();
          }}
        >
          <Feather name="refresh-cw" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Filter Tabs ── */}
      <View style={styles.tabs_row}>
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
            Active ({activeCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab_chip,
            activeTab === "delivered" && styles.tab_chip_active,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab("delivered");
          }}
        >
          <Text
            style={[
              styles.tab_chip_text,
              activeTab === "delivered" && styles.tab_chip_text_active,
            ]}
          >
            Delivered ({deliveredCount})
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
            Cancelled ({cancelledCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Deliveries List ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      >
        {loading ? (
          <View style={styles.center_box}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loading_text}>
              Loading restaurant deliveries...
            </Text>
          </View>
        ) : filteredDeliveries.length === 0 ? (
          <View style={styles.empty_box}>
            <View style={styles.empty_icon_circle}>
              <FontAwesome5 name="motorcycle" size={28} color="#777" />
            </View>
            <Text style={styles.empty_title}>No {activeTab} deliveries</Text>
            <Text style={styles.empty_sub}>
              {activeTab === "active"
                ? "Dispatched orders and searching riders will appear here."
                : `No ${activeTab} delivery records found.`}
            </Text>
          </View>
        ) : (
          filteredDeliveries.map((delivery) => {
            const foodOrder = delivery.food_order_id;
            const driverObj = delivery.driver;
            const driverUser = driverObj?.user;

            return (
              <View key={delivery._id} style={styles.card}>
                {/* Header row: Order # & Status Badge */}
                <View style={styles.card_header}>
                  <View style={styles.order_number_box}>
                    <FontAwesome5 name="receipt" size={14} color="#9CA3AF" />
                    <Text style={styles.order_number_text}>
                      Order #
                      {foodOrder?.order_number ||
                        delivery._id.slice(-6).toUpperCase()}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.status_badge,
                      delivery.status === "delivered"
                        ? styles.badge_green
                        : delivery.status === "arrived"
                          ? styles.badge_amber
                          : delivery.status === "in_transit"
                            ? styles.badge_purple
                            : ["cancelled", "expired"].includes(delivery.status)
                              ? styles.badge_red
                              : styles.badge_blue,
                    ]}
                  >
                    <Text
                      style={[
                        styles.status_badge_text,
                        delivery.status === "delivered"
                          ? { color: "#4caf50" }
                          : delivery.status === "arrived"
                            ? { color: "#ffc107" }
                            : delivery.status === "in_transit"
                              ? { color: "#ab47bc" }
                              : ["cancelled", "expired"].includes(
                                    delivery.status,
                                  )
                                ? { color: "#ef5350" }
                                : { color: "#2196f3" },
                      ]}
                    >
                      {delivery.status.replace("_", " ").toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Driver Section */}
                {driverObj ? (
                  <View style={styles.driver_section}>
                    <View style={styles.driver_avatar_box}>
                      {driverUser?.profile_pic ? (
                        <Image
                          source={{ uri: driverUser.profile_pic }}
                          style={styles.driver_avatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.avatar_placeholder}>
                          <FontAwesome5
                            name="motorcycle"
                            size={16}
                            color="#fff"
                          />
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.driver_title_row}>
                        <Text style={styles.driver_name}>
                          {driverUser?.name || "Dispatch Rider"}
                        </Text>
                        <View style={styles.rating_chip}>
                          <Feather name="star" size={11} color="#ffc107" />
                          <Text style={styles.rating_chip_text}>
                            {(driverObj.rating || 5.0).toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.driver_meta_text}>
                        {(driverObj.vehicle_type || "bike").toUpperCase()} •{" "}
                        {driverUser?.phone || "No Phone"}
                      </Text>
                    </View>

                    {driverUser?.phone ? (
                      <TouchableOpacity
                        style={styles.call_btn}
                        onPress={() => {
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light,
                          );
                          Linking.openURL(
                            `tel:${driverUser.phone.replace(/\s+/g, "")}`,
                          );
                        }}
                      >
                        <Feather name="phone-call" size={14} color="#fff" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.searching_box}>
                    <ActivityIndicator size="small" color="#ff9800" />
                    <Text style={styles.searching_text}>
                      Searching for nearby bike rider...
                    </Text>
                  </View>
                )}

                {/* Address Details */}
                <View style={styles.address_box}>
                  <View style={styles.address_line}>
                    <Feather name="map-pin" size={12} color="#4caf50" />
                    <Text style={styles.address_text_bold}>Pickup:</Text>
                    <Text style={styles.address_text} numberOfLines={1}>
                      {delivery.pickup?.address || "Restaurant Address"}
                    </Text>
                  </View>
                  <View style={styles.address_line}>
                    <Feather name="navigation" size={12} color="#2196f3" />
                    <Text style={styles.address_text_bold}>Dropoff:</Text>
                    <Text style={styles.address_text} numberOfLines={1}>
                      {delivery.dropoff?.address || "Customer Address"}
                    </Text>
                  </View>
                </View>

                {/* Footer: Fare & Payment Status */}
                <View style={styles.card_footer}>
                  <View>
                    <Text style={styles.fare_label}>DELIVERY FARE</Text>
                    <Text style={styles.fare_val}>
                      ₦{(delivery.fare || 1500).toLocaleString()}
                    </Text>
                  </View>

                  {delivery.status === "arrived" &&
                  delivery.payment_status !== "paid" ? (
                    <TouchableOpacity
                      style={styles.pay_btn}
                      disabled={
                        payingMap[
                          typeof foodOrder === "object"
                            ? foodOrder?._id
                            : delivery.food_order_id
                        ]
                      }
                      onPress={() =>
                        handlePayRider(
                          typeof foodOrder === "object"
                            ? foodOrder?._id
                            : delivery.food_order_id,
                        )
                      }
                    >
                      {payingMap[
                        typeof foodOrder === "object"
                          ? foodOrder?._id
                          : delivery.food_order_id
                      ] ? (
                        <ActivityIndicator size="small" color="#121212" />
                      ) : (
                        <Feather name="credit-card" size={13} color="#121212" />
                      )}
                      <Text style={styles.pay_btn_text}>
                        Pay Rider (₦1,500)
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.paid_badge}>
                      <Feather name="check" size={12} color="#4caf50" />
                      <Text style={styles.paid_text}>
                        {delivery.payment_status === "paid"
                          ? "Rider Paid"
                          : "Auto-Paid"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default RestaurantDeliveries;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  back_btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  header_title_box: {
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
    marginTop: 2,
  },
  refresh_btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },

  // Tabs
  tabs_row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  tab_chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  tab_chip_active: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  tab_chip_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  tab_chip_text_active: {
    color: "#121212",
  },

  // List
  scroll_content: {
    paddingHorizontal: 16,
    gap: 14,
  },
  center_box: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loading_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 13,
  },
  empty_box: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  empty_icon_circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  empty_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 12,
    textAlign: "center",
    maxWidth: "80%",
  },

  // Delivery Card
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  card_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  order_number_box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  order_number_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  status_badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  status_badge_text: {
    fontFamily: "raleway-bold",
    fontSize: 10,
  },
  badge_green: {
    backgroundColor: "#4caf5018",
    borderColor: "#4caf5044",
  },
  badge_amber: {
    backgroundColor: "#ffc10718",
    borderColor: "#ffc10744",
  },
  badge_purple: {
    backgroundColor: "#ab47bc18",
    borderColor: "#ab47bc44",
  },
  badge_blue: {
    backgroundColor: "#2196f318",
    borderColor: "#2196f344",
  },
  badge_red: {
    backgroundColor: "#ef535018",
    borderColor: "#ef535044",
  },

  // Driver Section
  driver_section: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  driver_avatar_box: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
    backgroundColor: "#333",
  },
  driver_avatar: {
    width: "100%",
    height: "100%",
  },
  avatar_placeholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  driver_title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  driver_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  rating_chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ffc1071e",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rating_chip_text: {
    color: "#ffc107",
    fontFamily: "raleway-bold",
    fontSize: 10,
  },
  driver_meta_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
    marginTop: 2,
  },
  call_btn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#ffffff1f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff33",
  },
  searching_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff980015",
    padding: 10,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#ff98003a",
  },
  searching_text: {
    color: "#ff9800",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },

  // Address
  address_box: {
    backgroundColor: "#161616",
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  address_line: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  address_text_bold: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  address_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    flex: 1,
  },

  // Footer
  card_footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  fare_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 9,
    letterSpacing: 0.5,
  },
  fare_val: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  pay_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  pay_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  paid_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4caf501c",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4caf5044",
  },
  paid_text: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
});
