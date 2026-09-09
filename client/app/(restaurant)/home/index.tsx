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
import { useRestaurantContext } from "../../../context/RestaurantContext";
import { useFoodOrderContext } from "../../../context/FoodOrderContext";
import { useTransactionContext } from "../../../context/TransactionContext";
import { useRatingContext } from "../../../context/RatingContext";

// ─── Restaurant Dashboard Screen ──────────────────────────────────────────────

const RestaurantHome = () => {
  const insets = useSafeAreaInsets();
  const { restaurant, setRestaurantOnlineStatus, fetchRestaurantProfile } =
    useRestaurantContext();
  const { vendorOrders, fetchVendorOrders } = useFoodOrderContext();
  const { vendorStats, fetchVendorEarningsStats } = useTransactionContext();
  const { restaurantRating, restaurantRatingCount, fetchRestaurantRatings } =
    useRatingContext();

  const [isStoreOnline, setIsStoreOnline] = useState(
    restaurant?.is_online ?? true,
  );
  const [sideNavOpen, setSideNavOpen] = useState(false);

  React.useEffect(() => {
    fetchRestaurantProfile();
    if (restaurant?._id) {
      fetchVendorOrders();
      fetchVendorEarningsStats();
      fetchRestaurantRatings(restaurant._id);
    }
  }, [restaurant?._id]);

  const completedTodayCount = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    return vendorOrders.filter(
      (o) =>
        o.status === "delivered" &&
        new Date(o.createdAt).toDateString() === todayStr,
    ).length;
  }, [vendorOrders]);

  React.useEffect(() => {
    if (restaurant?.is_online !== undefined) {
      setIsStoreOnline(restaurant.is_online);
    }
  }, [restaurant?.is_online]);

  const toggleOnlineStatus = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = !isStoreOnline;
    setIsStoreOnline(newStatus);
    try {
      await setRestaurantOnlineStatus(newStatus);
    } catch (e) {
      setIsStoreOnline(!newStatus);
    }
  };

  const handleSwitchToRiderMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)/home");
  };

  const handleGoToLiveOrders = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/(restaurant)/orders" as any);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop:
              Platform.OS === "ios" ? insets.top + 10 : insets.top + 14,
          },
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
            <Text style={styles.header_title}>Restaurant Dashboard</Text>
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
          {/* ── Banner & Logo Header (First on Page) ── */}
          <TouchableOpacity
            style={styles.hero_container}
            activeOpacity={0.92}
            onPress={() => router.push("/(restaurant)/details" as any)}
          >
            {/* Banner Image */}
            <View style={styles.banner_wrapper}>
              {restaurant?.banner ? (
                <Image
                  source={{ uri: restaurant.banner }}
                  style={styles.banner_image}
                  contentFit="cover"
                  transition={300}
                />
              ) : (
                <View style={styles.banner_placeholder}>
                  <Feather name="image" size={32} color="#ffffff44" />
                  <Text style={styles.banner_placeholder_text}>
                    No Banner Set
                  </Text>
                </View>
              )}
              <View style={styles.banner_overlay}>
                <View style={styles.edit_badge}>
                  <Feather name="edit-2" size={12} color="#fff" />
                  <Text style={styles.edit_badge_text}>Edit Details</Text>
                </View>
              </View>
            </View>

            {/* Logo (Halfway on top of banner) & Meta Information */}
            <View style={styles.restaurant_meta_card}>
              <View style={styles.logo_wrapper}>
                {restaurant?.logo ? (
                  <Image
                    source={{ uri: restaurant.logo }}
                    style={styles.logo_image}
                    contentFit="cover"
                    transition={300}
                  />
                ) : (
                  <View style={styles.logo_placeholder}>
                    <FontAwesome5 name="store" size={24} color="#fff" />
                  </View>
                )}
              </View>

              <View style={styles.restaurant_details}>
                <Text style={styles.restaurant_name_text} numberOfLines={1}>
                  {restaurant?.name || "My Restaurant"}
                </Text>

                <Text style={styles.restaurant_tags_text} numberOfLines={1}>
                  {restaurant?.category_tags?.length
                    ? restaurant.category_tags.join(" • ")
                    : "Food & Dining"}
                </Text>

                <View style={styles.rating_location_row}>
                  <View style={styles.rating_badge}>
                    <Feather name="star" size={12} color="#ffc107" />
                    <Text style={styles.rating_badge_text}>
                      {restaurant?.rating
                        ? restaurant.rating.toFixed(1)
                        : "5.0"}
                    </Text>
                    <Text style={styles.reviews_count_text}>
                      ({restaurant?.num_of_reviews || 0})
                    </Text>
                  </View>

                  {restaurant?.location?.address ? (
                    <View style={styles.location_badge}>
                      <Feather name="map-pin" size={11} color="#9CA3AF" />
                      <Text
                        style={styles.location_badge_text}
                        numberOfLines={1}
                      >
                        {restaurant.location.address}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── Store Online Status Card (Compact Sleek Bar) ── */}
          <View
            style={[
              styles.status_banner,
              isStoreOnline ? styles.status_online : styles.status_offline,
            ]}
          >
            <View style={styles.status_title_row}>
              <View
                style={[
                  styles.status_dot,
                  { backgroundColor: isStoreOnline ? "#4caf50" : "#9CA3AF" },
                ]}
              />
              <Text style={styles.status_title_text}>
                {isStoreOnline ? "Store Online" : "Store Offline"}
              </Text>
            </View>

            <Switch
              value={isStoreOnline}
              onValueChange={toggleOnlineStatus}
              trackColor={{ false: "#333", true: "#4caf5055" }}
              thumbColor={isStoreOnline ? "#4caf50" : "#9CA3AF"}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
          </View>

          {/* ── Overview Analysis Cards (Metrics Summary Grid) ── */}
          <View style={styles.metrics_grid}>
            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>TODAY'S REVENUE</Text>
              <Text style={styles.metric_value}>
                ₦{vendorStats.todayEarnings.toLocaleString()}
              </Text>
              <Text style={styles.metric_sub_green}>Realtime sales</Text>
            </View>

            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>COMPLETED TODAY</Text>
              <Text style={styles.metric_value}>{completedTodayCount}</Text>
              <Text style={styles.metric_sub_gray}>Orders delivered</Text>
            </View>

            <View style={styles.metric_card}>
              <Text style={styles.metric_label}>ACTIVE ORDERS</Text>
              <Text style={styles.metric_value}>
                {
                  vendorOrders.filter(
                    (o) =>
                      o.status !== "delivered" &&
                      o.status !== "cancelled" &&
                      o.status !== "rejected",
                  ).length
                }
              </Text>
              <Text style={styles.metric_sub_green}>In kitchen & transit</Text>
            </View>

            <TouchableOpacity
              style={styles.metric_card}
              onPress={() => router.push("/(restaurant)/reviews" as any)}
            >
              <Text style={styles.metric_label}>STORE RATING</Text>
              <Text style={styles.metric_value}>
                {(restaurantRating || restaurant?.rating || 5.0).toFixed(1)} ★
              </Text>
              <Text style={styles.metric_sub_gray}>
                Based on{" "}
                {restaurantRatingCount || restaurant?.num_of_reviews || 0}{" "}
                reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Big Live Orders Route Button (Positioned Below Overview Cards) ── */}
          <TouchableOpacity
            style={styles.big_orders_btn}
            activeOpacity={0.88}
            onPress={handleGoToLiveOrders}
          >
            <View style={styles.big_orders_btn_left}>
              <View style={styles.big_orders_icon_box}>
                <Feather name="shopping-bag" size={24} color="#121212" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.big_orders_title_row}>
                  <Text style={styles.big_orders_btn_title}>Live Orders</Text>
                  {isStoreOnline && <View style={styles.live_pulse_dot} />}
                </View>
                <Text style={styles.big_orders_btn_sub}>
                  Tap to view & manage active incoming orders
                </Text>
              </View>
            </View>
            <View style={styles.big_orders_arrow_box}>
              <Feather name="chevron-right" size={22} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* ── Quick Vendor Tools ── */}
          <View style={styles.section}>
            <Text style={styles.section_title}>Vendor Management</Text>

            <View style={styles.tools_grid}>
              <TouchableOpacity
                style={styles.tool_card}
                onPress={() => router.push("/(restaurant)/menu" as any)}
              >
                <View style={styles.tool_icon_box}>
                  <Feather name="list" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Menu & Details</Text>
                <Text style={styles.tool_sub}>Edit items & info</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tool_card}
                onPress={() => router.push("/(restaurant)/transactions" as any)}
              >
                <View style={styles.tool_icon_box}>
                  <Feather name="dollar-sign" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Payouts & Sales</Text>
                <Text style={styles.tool_sub}>View daily earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tool_card}
                onPress={() => router.push("/(restaurant)/reviews" as any)}
              >
                <View style={styles.tool_icon_box}>
                  <Feather name="star" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Customer Reviews</Text>
                <Text style={styles.tool_sub}>Ratings & feedback</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.tool_card}
                onPress={() => router.push("/(restaurant)/details" as any)}
              >
                <View style={styles.tool_icon_box}>
                  <Feather name="settings" size={18} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Store Profile</Text>
                <Text style={styles.tool_sub}>Edit banner, info & times</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* SideNav Drawer */}
      <SideNav
        mode="restaurant"
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
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
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
    paddingTop: 8,
    gap: 16,
  },

  // ── Hero Banner & Overlapping Logo Header ──
  hero_container: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  banner_wrapper: {
    height: 140,
    width: "100%",
    backgroundColor: "#222",
    position: "relative",
  },
  banner_image: {
    width: "100%",
    height: "100%",
  },
  banner_placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1f1f1f",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  banner_placeholder_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  banner_overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    padding: 10,
  },
  edit_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#00000088",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffffff33",
  },
  edit_badge_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 10,
  },
  restaurant_meta_card: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: -40, // 50% overlap on top of 80px banner edge
    gap: 14,
  },
  logo_wrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#1a1a1a",
    borderWidth: 3.5,
    borderColor: "#121212",
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  logo_image: {
    width: "100%",
    height: "100%",
  },
  logo_placeholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurant_details: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 10,
  },
  restaurant_name_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 2,
  },
  restaurant_tags_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 12,
    marginBottom: 6,
  },
  rating_location_row: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  rating_badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffc1071e",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#ffc10744",
  },
  rating_badge_text: {
    color: "#ffc107",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  reviews_count_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 10,
  },
  location_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "55%",
  },
  location_badge_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },

  // ── Compact Store Online Bar ──
  status_banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
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
  },
  status_dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  status_title_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // ── Big Live Orders Button ──
  big_orders_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: "#ffffff18",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  big_orders_btn_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  big_orders_icon_box: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  big_orders_title_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  big_orders_btn_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  live_pulse_dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  big_orders_btn_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 2,
  },
  big_orders_arrow_box: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
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
  section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
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
