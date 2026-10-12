import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import SideNav from "../../../components/SideNav";
import { useRestaurantContext } from "../../../context/RestaurantContext";
import {
  useFoodOrderContext,
  FoodOrderType,
} from "../../../context/FoodOrderContext";
import { useTransactionContext } from "../../../context/TransactionContext";
import { useRatingContext } from "../../../context/RatingContext";
import { getUserSocket } from "../../../sockets/socketService";

// ─── Restaurant Dashboard Screen ──────────────────────────────────────────────

const RestaurantHome = () => {
  const insets = useSafeAreaInsets();
  const { restaurant, setRestaurantOnlineStatus, fetchRestaurantProfile } =
    useRestaurantContext();
  const { vendorOrders, fetchVendorOrders, acceptOrder, rejectOrder } =
    useFoodOrderContext();
  const { vendorStats, fetchVendorEarningsStats } = useTransactionContext();
  const { restaurantRating, restaurantRatingCount, fetchRestaurantRatings } =
    useRatingContext();

  const [isStoreOnline, setIsStoreOnline] = useState(
    restaurant?.is_online ?? true,
  );
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Incoming Orders Queue State & Gorhom Bottom Sheet ──
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [incomingQueue, setIncomingQueue] = useState<FoodOrderType[]>([]);
  const handledOrderIdsRef = useRef<Set<string>>(new Set());
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const snapPoints = useMemo(() => ["80%"], []);

  const processIncomingOrders = useCallback((ordersList: FoodOrderType[]) => {
    if (!ordersList || !Array.isArray(ordersList)) return;
    const placed = ordersList.filter(
      (o) => o.status === "placed" && !handledOrderIdsRef.current.has(o._id),
    );
    if (placed.length === 0) return;

    setIncomingQueue((prevQueue) => {
      const existingIds = new Set(prevQueue.map((o) => o._id));
      const newOrders = placed.filter((o) => !existingIds.has(o._id));
      if (newOrders.length === 0) return prevQueue;
      return [...prevQueue, ...newOrders];
    });
  }, []);

  // Sync placed orders whenever vendorOrders updates from context
  useEffect(() => {
    if (vendorOrders && vendorOrders.length > 0) {
      processIncomingOrders(vendorOrders);
    }
  }, [vendorOrders, processIncomingOrders]);

  // Open bottom sheet whenever queue has pending orders
  useEffect(() => {
    if (incomingQueue.length > 0) {
      bottomSheetRef.current?.snapToIndex(0);
      setIsSheetOpen(true);
    } else {
      bottomSheetRef.current?.close();
      setIsSheetOpen(false);
    }
  }, [incomingQueue.length]);

  // Socket listener for real-time new incoming orders
  useEffect(() => {
    const socket = getUserSocket();
    if (!socket) return;

    const onNewOrder = async () => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const latest = await fetchVendorOrders();
        if (latest && latest.length > 0) {
          processIncomingOrders(latest);
        }
      } catch (e) {
        console.log("Error handling new_food_order in RestaurantHome:", e);
      }
    };

    const onOrderCancelled = (data: any) => {
      const cancelledId = data?.order_id || data?._id;
      if (cancelledId) {
        handledOrderIdsRef.current.add(cancelledId);
        setIncomingQueue((prev) => prev.filter((o) => o._id !== cancelledId));
      }
    };

    socket.on("new_food_order", onNewOrder);
    socket.on("food_order_cancelled", onOrderCancelled);

    return () => {
      socket.off("new_food_order", onNewOrder);
      socket.off("food_order_cancelled", onOrderCancelled);
    };
  }, [fetchVendorOrders, processIncomingOrders]);

  const handleAcceptCurrentOrder = async () => {
    if (incomingQueue.length === 0 || isActionLoading) return;
    const current = incomingQueue[0];
    setIsActionLoading(true);
    setActionType("accept");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await acceptOrder(current._id);
      handledOrderIdsRef.current.add(current._id);

      const remaining = incomingQueue.slice(1);
      setIncomingQueue(remaining);

      if (remaining.length === 0) {
        bottomSheetRef.current?.close();
        setIsSheetOpen(false);
        router.push("/(restaurant)/orders" as any);
      }
    } catch (e) {
      console.log("Error accepting order:", e);
    } finally {
      setIsActionLoading(false);
      setActionType(null);
    }
  };

  const handleDeclineCurrentOrder = () => {
    if (incomingQueue.length === 0 || isActionLoading) return;
    const current = incomingQueue[0];

    Alert.alert(
      "Decline Order",
      `Are you sure you want to decline order #${current.order_number}?`,
      [
        { text: "Keep Order", style: "cancel" },
        {
          text: "Decline",
          style: "destructive",
          onPress: async () => {
            setIsActionLoading(true);
            setActionType("decline");
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              await rejectOrder(current._id, "Declined by restaurant");
              handledOrderIdsRef.current.add(current._id);

              const remaining = incomingQueue.slice(1);
              setIncomingQueue(remaining);

              if (remaining.length === 0) {
                bottomSheetRef.current?.close();
                setIsSheetOpen(false);
                router.push("/(restaurant)/orders" as any);
              }
            } catch (e) {
              console.log("Error declining order:", e);
            } finally {
              setIsActionLoading(false);
              setActionType(null);
            }
          },
        },
      ],
    );
  };

  const handleSheetChanges = useCallback((index: number) => {
    setIsSheetOpen(index >= 0);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.7}
        pressBehavior="none"
      />
    ),
    [],
  );

  const handleCallCustomer = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  React.useEffect(() => {
    fetchRestaurantProfile();
    if (restaurant?._id) {
      fetchVendorOrders();
      fetchVendorEarningsStats();
      fetchRestaurantRatings(restaurant._id);
    }
  }, [restaurant?._id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const rest = await fetchRestaurantProfile();
      const targetId = rest?._id || restaurant?._id;
      const tasks: Promise<any>[] = [
        fetchVendorOrders(),
        fetchVendorEarningsStats(),
      ];
      if (targetId) {
        tasks.push(fetchRestaurantRatings(targetId));
      }
      await Promise.all(tasks);
    } catch (e) {
      console.log("Error refreshing restaurant home:", e);
    } finally {
      setRefreshing(false);
    }
  };

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
    <View style={styles.screen_root}>
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

        {/* ── Floating Pending Orders Banner (when sheet is minimized) ── */}
        {incomingQueue.length > 0 && !isSheetOpen && (
          <TouchableOpacity
            style={styles.pending_orders_banner}
            activeOpacity={0.9}
            onPress={() => {
              bottomSheetRef.current?.snapToIndex(0);
              setIsSheetOpen(true);
            }}
          >
            <View style={styles.pending_banner_left}>
              <View style={styles.pending_pulse_dot} />
              <Text style={styles.pending_banner_text}>
                {incomingQueue.length} New Order
                {incomingQueue.length > 1 ? "s" : ""} waiting!
              </Text>
            </View>
            <View style={styles.pending_banner_btn}>
              <Text style={styles.pending_banner_btn_text}>Review</Text>
              <Feather name="chevron-up" size={14} color="#121212" />
            </View>
          </TouchableOpacity>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.scroll_content,
            { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
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
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push("/(restaurant)/deliveries" as any);
                }}
              >
                <View style={styles.tool_icon_box}>
                  <FontAwesome5 name="motorcycle" size={16} color="#fff" />
                </View>
                <Text style={styles.tool_title}>Deliveries</Text>
                <Text style={styles.tool_sub}>View rider dispatches</Text>
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

      {/* ── Incoming Order Gorhom Bottom Sheet Modal ── */}
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enableDynamicSizing={false}
        enableOverDrag={false}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        enablePanDownToClose={true}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.bottom_sheet_bg}
        handleIndicatorStyle={styles.bottom_sheet_handle}
      >
        {incomingQueue.length > 0 && incomingQueue[0] ? (
          <BottomSheetView style={styles.sheet_container}>
            {/* ── Header ── */}
            <View style={styles.modal_header_row}>
              <View style={styles.new_order_pill}>
                <View style={styles.pulse_dot_green} />
                <Text style={styles.new_order_pill_text}>
                  NEW INCOMING ORDER
                </Text>
              </View>
              <Text style={styles.order_time_text}>
                {new Date(incomingQueue[0].createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            {/* ── Order Title & Queue Badge ── */}
            <View style={styles.order_number_row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.order_number_title}>
                  Order #{incomingQueue[0].order_number}
                </Text>
              </View>
              {incomingQueue.length > 1 && (
                <View style={styles.queue_counter_badge}>
                  <Feather
                    name="layers"
                    size={13}
                    color="#f59e0b"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.queue_counter_text}>
                    1 of {incomingQueue.length} Orders
                  </Text>
                </View>
              )}
            </View>

            {/* ── Multiple Orders Alert Banner ── */}
            {incomingQueue.length > 1 && (
              <View style={styles.queue_alert_strip}>
                <Feather name="info" size={13} color="#f59e0b" />
                <Text style={styles.queue_alert_text}>
                  {incomingQueue.length - 1} more order
                  {incomingQueue.length > 2 ? "s" : ""} waiting. Next order will
                  appear automatically!
                </Text>
              </View>
            )}

            {/* ── Scrollable Order Details ── */}
            <BottomSheetScrollView
              key={incomingQueue[0]._id}
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={styles.sheet_scroll_content}
            >
              {/* Customer & Delivery Card */}
              <View style={styles.customer_card}>
                <View style={styles.customer_header}>
                  <View style={styles.customer_avatar_box}>
                    <Feather name="user" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customer_name} numberOfLines={1}>
                      {typeof incomingQueue[0].customer === "object"
                        ? incomingQueue[0].customer?.name
                        : "Customer"}
                    </Text>
                    {typeof incomingQueue[0].customer === "object" &&
                    incomingQueue[0].customer?.phone ? (
                      <Text style={styles.customer_phone}>
                        {incomingQueue[0].customer.phone}
                      </Text>
                    ) : null}
                  </View>

                  {typeof incomingQueue[0].customer === "object" &&
                  incomingQueue[0].customer?.phone ? (
                    <TouchableOpacity
                      style={styles.call_btn}
                      onPress={() =>
                        handleCallCustomer(
                          typeof incomingQueue[0].customer === "object"
                            ? incomingQueue[0].customer?.phone
                            : undefined,
                        )
                      }
                    >
                      <Feather name="phone" size={14} color="#10b981" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.divider} />

                {/* Delivery Address */}
                <View style={styles.delivery_row}>
                  <View style={styles.delivery_icon_box}>
                    <Feather name="map-pin" size={14} color="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.delivery_label}>DELIVERY LOCATION</Text>
                    <Text style={styles.delivery_address}>
                      {incomingQueue[0].delivery_address?.address ||
                        "Delivery Address"}
                    </Text>
                    {incomingQueue[0].delivery_address?.landmark ? (
                      <Text style={styles.delivery_landmark}>
                        Landmark: {incomingQueue[0].delivery_address.landmark}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Items Card */}
              <View style={styles.items_card}>
                <View style={styles.items_card_header}>
                  <Text style={styles.items_card_title}>
                    ORDER ITEMS (
                    {incomingQueue[0].items?.reduce(
                      (acc, it) => acc + (it.quantity || 1),
                      0,
                    ) || 0}
                    )
                  </Text>
                </View>

                {incomingQueue[0].items?.map((it, idx) => (
                  <View
                    key={it._id || `${it.menu_item_id}-${idx}`}
                    style={[
                      styles.item_row,
                      idx > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: "#2a2a2a",
                      },
                    ]}
                  >
                    <View style={styles.item_qty_pill}>
                      <Text style={styles.item_qty_text}>{it.quantity}x</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.item_name}>{it.name}</Text>
                      {it.selected_options &&
                        it.selected_options.length > 0 && (
                          <View style={styles.options_wrapper}>
                            {it.selected_options.map((opt, oIdx) => (
                              <Text key={oIdx} style={styles.option_tag}>
                                + {opt.option_name}
                              </Text>
                            ))}
                          </View>
                        )}
                      {it.special_instructions ? (
                        <View style={styles.special_instruction_box}>
                          <Feather
                            name="message-square"
                            size={11}
                            color="#f59e0b"
                          />
                          <Text style={styles.special_instruction_text}>
                            {it.special_instructions}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>

              {/* Straight to the point Pricing Card */}
              <View style={styles.pricing_card}>
                <View style={styles.pricing_row}>
                  <Text style={styles.pricing_label}>Food Item Fee</Text>
                  <Text style={styles.pricing_value}>
                    ₦
                    {(incomingQueue[0].pricing?.subtotal || 0).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.pricing_row}>
                  <Text style={styles.pricing_label}>Delivery Fee</Text>
                  <Text style={styles.pricing_value}>
                    ₦
                    {(
                      incomingQueue[0].pricing?.delivery_fee || 0
                    ).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.pricing_row}>
                  <Text style={styles.total_label}>Total</Text>
                  <Text style={styles.total_value}>
                    ₦
                    {(
                      (incomingQueue[0].pricing?.subtotal || 0) +
                      (incomingQueue[0].pricing?.delivery_fee || 0)
                    ).toLocaleString()}
                  </Text>
                </View>
              </View>
            </BottomSheetScrollView>

            {/* ── Sticky Action Buttons ── */}
            <View style={styles.sheet_footer}>
              <TouchableOpacity
                style={[
                  styles.decline_btn,
                  isActionLoading && styles.btn_disabled,
                ]}
                activeOpacity={0.8}
                disabled={isActionLoading}
                onPress={handleDeclineCurrentOrder}
              >
                {isActionLoading && actionType === "decline" ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <>
                    <Feather name="x" size={18} color="#ef4444" />
                    <Text style={styles.decline_btn_text}>Decline</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accept_btn,
                  isActionLoading && styles.btn_disabled,
                ]}
                activeOpacity={0.85}
                disabled={isActionLoading}
                onPress={handleAcceptCurrentOrder}
              >
                {isActionLoading && actionType === "accept" ? (
                  <ActivityIndicator size="small" color="#121212" />
                ) : (
                  <>
                    <Feather name="check-circle" size={18} color="#121212" />
                    <Text style={styles.accept_btn_text}>Accept Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        ) : (
          <BottomSheetView style={{ flex: 1 }}>
            <View />
          </BottomSheetView>
        )}
      </BottomSheet>
    </View>
  );
};

export default RestaurantHome;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen_root: {
    flex: 1,
    backgroundColor: "#121212",
  },
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

  // ── Bottom Sheet & Incoming Order Modal Styles ──
  bottom_sheet_bg: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "#2e2e2e",
  },
  bottom_sheet_handle: {
    backgroundColor: "#555",
    width: 44,
    height: 5,
    borderRadius: 10,
    marginTop: 8,
  },
  sheet_container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  modal_header_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  new_order_pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#064e3b",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#05966955",
  },
  pulse_dot_green: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  new_order_pill_text: {
    color: "#10b981",
    fontFamily: "raleway-bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  order_time_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  order_number_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  order_number_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 22,
  },
  queue_counter_badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f59e0b1a",
    borderWidth: 1,
    borderColor: "#f59e0b44",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  queue_counter_text: {
    color: "#f59e0b",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  queue_alert_strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#221c08",
    borderWidth: 1,
    borderColor: "#f59e0b33",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  queue_alert_text: {
    color: "#fbbf24",
    fontFamily: "raleway-semibold",
    fontSize: 12,
    flex: 1,
  },
  sheet_scroll_content: {
    paddingBottom: 16,
    gap: 12,
  },
  customer_card: {
    backgroundColor: "#202020",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  customer_header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customer_avatar_box: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  customer_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  customer_phone: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
    marginTop: 2,
  },
  call_btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#064e3b33",
    borderWidth: 1,
    borderColor: "#10b98144",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 10,
  },
  delivery_row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  delivery_icon_box: {
    marginTop: 2,
  },
  delivery_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-bold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  delivery_address: {
    color: "#e5e7eb",
    fontFamily: "raleway-semibold",
    fontSize: 13,
    lineHeight: 18,
  },
  delivery_landmark: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginTop: 3,
  },
  items_card: {
    backgroundColor: "#202020",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  items_card_header: {
    marginBottom: 10,
  },
  items_card_title: {
    color: "#9CA3AF",
    fontFamily: "raleway-bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  item_row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
  item_qty_pill: {
    backgroundColor: "#2e2e2e",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  item_qty_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  item_name: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  options_wrapper: {
    marginTop: 4,
    gap: 2,
  },
  option_tag: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  special_instruction_box: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#2e2511",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  special_instruction_text: {
    color: "#fbbf24",
    fontFamily: "raleway-medium",
    fontSize: 12,
  },
  item_price: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  pricing_card: {
    backgroundColor: "#202020",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2e2e2e",
  },
  pricing_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  pricing_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  pricing_value: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  total_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  total_value: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  payment_pill: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  payment_pill_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  earnings_row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  earnings_label: {
    color: "#10b981",
    fontFamily: "raleway-bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  earnings_sub: {
    color: "#6b7280",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  earnings_value: {
    color: "#10b981",
    fontFamily: "raleway-bold",
    fontSize: 20,
  },
  sheet_footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  decline_btn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#2b1414",
    borderWidth: 1,
    borderColor: "#ef444444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  decline_btn_text: {
    color: "#ef4444",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  accept_btn: {
    flex: 1.8,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  accept_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  btn_disabled: {
    opacity: 0.5,
  },
  pending_orders_banner: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: "#064e3b",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#10b98155",
  },
  pending_banner_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  pending_pulse_dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  pending_banner_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
    flex: 1,
  },
  pending_banner_btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pending_banner_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
});
