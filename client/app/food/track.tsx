import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { darkMapStyle } from "../../data/map.dark";
import {
  useFoodOrderContext,
  FoodOrderType,
} from "../../context/FoodOrderContext";
import { useMapContext } from "../../context/MapContext";
import AppLoading from "../../loadings/AppLoading";
import { getUserSocket } from "../../sockets/socketService";

const parseLatLng = (coords?: [number, number]) => {
  if (!coords || coords.length < 2) return null;
  if (coords[0] < 5 && coords[1] >= 5) {
    return { latitude: coords[1], longitude: coords[0] };
  }
  if (coords[0] >= 5 && coords[1] < 5) {
    return { latitude: coords[0], longitude: coords[1] };
  }
  return { latitude: coords[0], longitude: coords[1] };
};

const TrackFoodOrder = () => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { id, orderId, order_id } = useLocalSearchParams();
  const targetId = (id || orderId || order_id) as string;

  const { activeOrder, fetchOrderById, customerOrders, fetchCustomerOrders } =
    useFoodOrderContext();

  const { getRoute } = useMapContext();

  const [order, setOrder] = useState<FoodOrderType | null>(activeOrder);
  const [loading, setLoading] = useState<boolean>(true);

  // Exact Road-Snapped Polyline & Marker Coordinates (No Default Flash)
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [restaurantMarker, setRestaurantMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [deliveryMarker, setDeliveryMarker] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadOrder = async () => {
      setLoading(true);
      if (targetId) {
        const fetched = await fetchOrderById(targetId);
        if (isMounted && fetched) {
          setOrder(fetched);
          setLoading(false);
          return;
        }
      }
      if (activeOrder) {
        setOrder(activeOrder);
        setLoading(false);
        return;
      }
      const customerList = await fetchCustomerOrders();
      if (isMounted && customerList && customerList.length > 0) {
        setOrder(customerList[0]);
      }
      setLoading(false);
    };

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [targetId]);

  // Real-time Socket Listener for Food Order & Driver Updates
  useEffect(() => {
    const currentOrderId = order?._id || targetId;
    if (!currentOrderId) return;

    const socket = getUserSocket();
    if (socket) {
      socket.emit("join_room", `food_order_${currentOrderId}`);

      const handleUpdate = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const updated = await fetchOrderById(currentOrderId);
        if (updated) {
          setOrder(updated);
        }
      };

      socket.on("food_order_updated", handleUpdate);
      socket.on("delivery_accepted", handleUpdate);
      socket.on("delivery_arrived", handleUpdate);
      socket.on("delivery_in_transit", handleUpdate);

      return () => {
        socket.off("food_order_updated", handleUpdate);
        socket.off("delivery_accepted", handleUpdate);
        socket.off("delivery_arrived", handleUpdate);
        socket.off("delivery_in_transit", handleUpdate);
      };
    }
  }, [order?._id, targetId]);

  // Fetch Route Polyline & Snapped Markers
  useEffect(() => {
    if (!order) return;
    const restPoint = parseLatLng(order.restaurant_address?.coordinates);
    const delivPoint = parseLatLng(order.delivery_address?.coordinates);

    if (!restPoint || !delivPoint) return;

    let isCancelled = false;
    const fetchRouteCoords = async () => {
      try {
        const res = await getRoute(
          [restPoint.latitude, restPoint.longitude],
          [delivPoint.latitude, delivPoint.longitude]
        );
        if (isCancelled) return;

        if (res && res.coords && res.coords.length > 0) {
          const startTip = res.pickupOnRoad || res.coords[0];
          const endTip =
            res.destinationOnRoad || res.coords[res.coords.length - 1];
          setRouteCoords(res.coords);
          setRestaurantMarker(startTip);
          setDeliveryMarker(endTip);
        } else {
          const fallback = [restPoint, delivPoint];
          setRouteCoords(fallback);
          setRestaurantMarker(restPoint);
          setDeliveryMarker(delivPoint);
        }
      } catch (e) {
        if (isCancelled) return;
        const fallback = [restPoint, delivPoint];
        setRouteCoords(fallback);
        setRestaurantMarker(restPoint);
        setDeliveryMarker(delivPoint);
      }
    };

    fetchRouteCoords();
    return () => {
      isCancelled = true;
    };
  }, [order?._id, order?.restaurant_address, order?.delivery_address]);

  // Fit Map Boundaries to Route
  useEffect(() => {
    if (routeCoords.length > 0 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(routeCoords, {
          edgePadding: { top: 70, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 400);
    }
  }, [routeCoords]);

  if (loading && !order) {
    return <AppLoading />;
  }

  if (!order) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", padding: 20 },
        ]}
      >
        <Feather name="shopping-bag" size={48} color="#555" />
        <Text
          style={{
            color: "#fff",
            fontFamily: "raleway-bold",
            fontSize: 18,
            marginTop: 16,
          }}
        >
          No Active Order Found
        </Text>
        <Text
          style={{
            color: "#777",
            fontFamily: "raleway-regular",
            fontSize: 13,
            textAlign: "center",
            marginTop: 6,
            marginBottom: 20,
          }}
        >
          You don't have any active food orders to track right now.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 20,
          }}
          onPress={() => router.back()}
        >
          <Text
            style={{
              color: "#121212",
              fontFamily: "raleway-bold",
              fontSize: 14,
            }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Restaurant details
  const restaurantName =
    typeof order.restaurant === "object"
      ? order.restaurant.name
      : order.restaurant_address?.name || "Restaurant";
  const restaurantAddress =
    order.restaurant_address?.address || "Restaurant Address";

  // Driver details
  const driverObj: any = typeof order.driver === "object" ? order.driver : null;
  const driverUser = driverObj?.user || driverObj;
  const driverName = driverUser?.name || driverObj?.name || "Assigning Dispatch Rider...";
  const driverPhone = driverUser?.phone || driverObj?.phone || "";
  const driverPic = driverUser?.profile_pic || driverObj?.profile_pic;

  // Midpoint for rider fallback marker
  const riderCoords =
    restaurantMarker && deliveryMarker
      ? {
          latitude: (restaurantMarker.latitude + deliveryMarker.latitude) / 2,
          longitude:
            (restaurantMarker.longitude + deliveryMarker.longitude) / 2,
        }
      : null;

  // Dynamic Status & Step Calculation
  const status = order.status || "placed";
  let currentStep = 1;
  let progressWidth = "15%";
  let statusBadgeText = "PLACED";
  let statusHeadline = "Order Received";
  let statusSub = "The restaurant has received your order.";

  if (status === "preparing") {
    currentStep = 2;
    progressWidth = "45%";
    statusBadgeText = "PREPARING";
    statusHeadline = "Kitchen is preparing your food";
    statusSub = "Your meal is being freshly cooked by the chef.";
  } else if (status === "ready_for_pickup" || status === "in_transit") {
    currentStep = 3;
    progressWidth = "75%";
    statusBadgeText = "ON THE WAY";
    statusHeadline = "Your food is on the way!";
    statusSub = "Rider is heading to your delivery location.";
  } else if (status === "delivered") {
    currentStep = 4;
    progressWidth = "100%";
    statusBadgeText = "DELIVERED";
    statusHeadline = "Order Delivered!";
    statusSub = "Enjoy your meal! Thank you for ordering.";
  } else if (status === "cancelled" || status === "rejected") {
    currentStep = 0;
    progressWidth = "0%";
    statusBadgeText = status.toUpperCase();
    statusHeadline = "Order Cancelled";
    statusSub = "This order was cancelled.";
  }

  const initialLat = restaurantMarker?.latitude || 6.5244;
  const initialLng = restaurantMarker?.longitude || 3.3792;

  return (
    <View style={styles.container}>
      {/* ── Map Header View ── */}
      <View style={styles.map_container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: initialLat,
            longitude: initialLng,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          }}
          customMapStyle={darkMapStyle}
          toolbarEnabled={false}
        >
          {/* Render Route Polyline ONLY when fetched route is available (Eliminating default route flash) */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#ffffff"
              strokeWidth={4}
            />
          )}

          {/* Restaurant Marker (Placed EXACTLY at start tip of polyline) */}
          {restaurantMarker && (
            <Marker coordinate={restaurantMarker} title={restaurantName} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.marker_box_store}>
                <Feather name="shopping-bag" size={14} color="#121212" />
              </View>
            </Marker>
          )}

          {/* Dispatch Rider Marker */}
          {riderCoords && (
            <Marker
              coordinate={riderCoords}
              title={driverName}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.marker_box_rider}>
                <Feather name="navigation" size={16} color="#fff" />
              </View>
            </Marker>
          )}

          {/* User Delivery Address Marker (Placed EXACTLY at end tip of polyline) */}
          {deliveryMarker && (
            <Marker coordinate={deliveryMarker} title="Delivery Address" anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.marker_box_user}>
                <View style={styles.marker_user_dot} />
              </View>
            </Marker>
          )}
        </MapView>

        {/* Floating Top Bar Back Button */}
        <View style={[styles.floating_top_bar, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity
            style={styles.back_btn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.back();
            }}
          >
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable Order & Delivery Details Sheet ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.sheet_container}
        contentContainerStyle={[
          styles.sheet_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 30 : 40 },
        ]}
      >
        {/* Status Header Bar */}
        <View style={styles.status_card}>
          <View style={styles.status_top_row}>
            <View
              style={[
                styles.in_transit_badge,
                status === "cancelled" || status === "rejected"
                  ? styles.badge_error
                  : status === "delivered"
                  ? styles.badge_success
                  : null,
              ]}
            >
              <View
                style={[
                  styles.live_dot,
                  status === "cancelled" || status === "rejected"
                    ? { backgroundColor: "#f44336" }
                    : status === "delivered"
                    ? { backgroundColor: "#4caf50" }
                    : null,
                ]}
              />
              <Text
                style={[
                  styles.in_transit_text,
                  status === "cancelled" || status === "rejected"
                    ? { color: "#f44336" }
                    : status === "delivered"
                    ? { color: "#4caf50" }
                    : null,
                ]}
              >
                {statusBadgeText}
              </Text>
            </View>
            <Text style={styles.order_number_text}>
              #{order.order_number || order._id.slice(-6).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.status_headline}>{statusHeadline}</Text>
          <Text style={styles.status_sub}>{statusSub}</Text>

          {/* Progress Bar Timeline */}
          <View style={styles.timeline_box}>
            <View style={styles.timeline_track_container}>
              <View style={styles.timeline_line_bg} />
              <View
                style={[
                  styles.timeline_line_fill,
                  { width: progressWidth as any },
                ]}
              />

              <View style={styles.timeline_steps_row}>
                {/* Step 1: Placed */}
                <View
                  style={[
                    styles.step_node,
                    currentStep > 1
                      ? styles.step_node_complete
                      : currentStep === 1
                      ? styles.step_node_active
                      : styles.step_node_pending,
                  ]}
                >
                  {currentStep > 1 ? (
                    <Feather name="check" size={10} color="#121212" />
                  ) : currentStep === 1 ? (
                    <View style={styles.active_node_inner} />
                  ) : null}
                </View>

                {/* Step 2: Preparing */}
                <View
                  style={[
                    styles.step_node,
                    currentStep > 2
                      ? styles.step_node_complete
                      : currentStep === 2
                      ? styles.step_node_active
                      : styles.step_node_pending,
                  ]}
                >
                  {currentStep > 2 ? (
                    <Feather name="check" size={10} color="#121212" />
                  ) : currentStep === 2 ? (
                    <View style={styles.active_node_inner} />
                  ) : null}
                </View>

                {/* Step 3: On the Way */}
                <View
                  style={[
                    styles.step_node,
                    currentStep > 3
                      ? styles.step_node_complete
                      : currentStep === 3
                      ? styles.step_node_active
                      : styles.step_node_pending,
                  ]}
                >
                  {currentStep > 3 ? (
                    <Feather name="check" size={10} color="#121212" />
                  ) : currentStep === 3 ? (
                    <View style={styles.active_node_inner} />
                  ) : null}
                </View>

                {/* Step 4: Delivered */}
                <View
                  style={[
                    styles.step_node,
                    currentStep === 4
                      ? styles.step_node_complete
                      : styles.step_node_pending,
                  ]}
                >
                  {currentStep === 4 && (
                    <Feather name="check" size={10} color="#121212" />
                  )}
                </View>
              </View>
            </View>

            {/* Step Labels */}
            <View style={styles.timeline_labels_row}>
              <Text
                style={
                  currentStep >= 1
                    ? styles.step_label_active
                    : styles.step_label_pending
                }
              >
                Placed
              </Text>
              <Text
                style={
                  currentStep >= 2
                    ? styles.step_label_active
                    : styles.step_label_pending
                }
              >
                Preparing
              </Text>
              <Text
                style={
                  currentStep >= 3
                    ? styles.step_label_active
                    : styles.step_label_pending
                }
              >
                On the Way
              </Text>
              <Text
                style={
                  currentStep >= 4
                    ? styles.step_label_active
                    : styles.step_label_pending
                }
              >
                Delivered
              </Text>
            </View>
          </View>
        </View>

        {/* ── Dispatch Rider Card ── */}
        <View style={styles.rider_card}>
          {driverPic ? (
            <Image
              source={{ uri: driverPic }}
              style={styles.rider_avatar}
              contentFit="cover"
            />
          ) : (
            <Image
              source={require("../../assets/images/user.png")}
              style={styles.rider_avatar}
              contentFit="cover"
            />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.rider_name}>{driverName}</Text>
            <Text style={styles.rider_vehicle}>
              {driverObj ? "Igle Verified Rider" : "Courier Assignment Pending"}
            </Text>
          </View>
          {driverPhone ? (
            <View style={styles.rider_actions}>
              <TouchableOpacity
                style={styles.action_icon_btn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`tel:${driverPhone}`);
                }}
              >
                <Feather name="phone" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.action_icon_btn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL(`sms:${driverPhone}`);
                }}
              >
                <Feather name="message-square" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* ── Restaurant & Order Items Details ── */}
        <View style={styles.details_card}>
          <View style={styles.restaurant_row}>
            <View style={styles.store_icon_box}>
              <Feather name="shopping-bag" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurant_title}>{restaurantName}</Text>
              <Text style={styles.restaurant_address} numberOfLines={1}>
                {restaurantAddress}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Items Purchased (with images) */}
          <Text style={styles.section_subtitle}>
            Order Summary ({order.items?.length || 0} items)
          </Text>

          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => {
              const imageUri = item.image;
              const optionsText =
                item.selected_options && item.selected_options.length > 0
                  ? item.selected_options.map((o) => o.option_name).join(", ")
                  : null;
              const totalCost = item.item_total || item.price * item.quantity;

              return (
                <View key={item._id || idx} style={styles.item_card_row}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.item_image}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.item_image_placeholder}>
                      <Feather name="coffee" size={16} color="#777" />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.item_name_text}>{item.name}</Text>
                    {optionsText && (
                      <Text style={styles.item_options_text}>
                        {optionsText}
                      </Text>
                    )}
                    <Text style={styles.item_qty_text}>
                      Qty: {item.quantity}
                    </Text>
                  </View>

                  <Text style={styles.item_price_text}>
                    ₦{totalCost.toLocaleString()}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={{ color: "#777", fontSize: 13 }}>
              No item details available.
            </Text>
          )}

          <View style={styles.divider} />

          {/* Payment Breakdown */}
          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Subtotal</Text>
            <Text style={styles.breakdown_value}>
              ₦{(order.pricing?.subtotal || 0).toLocaleString()}
            </Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Delivery Fee</Text>
            <Text style={styles.breakdown_value}>
              ₦{(order.pricing?.delivery_fee || 0).toLocaleString()}
            </Text>
          </View>

          {order.pricing?.service_fee ? (
            <View style={styles.breakdown_row}>
              <Text style={styles.breakdown_label}>Service Fee</Text>
              <Text style={styles.breakdown_value}>
                ₦{order.pricing.service_fee.toLocaleString()}
              </Text>
            </View>
          ) : null}

          <View style={styles.total_row}>
            <Text style={styles.total_label}>Total Paid</Text>
            <Text style={styles.total_value}>
              ₦{(order.pricing?.total || 0).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        <View style={styles.address_card}>
          <Feather name="map-pin" size={18} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.address_label}>DELIVER TO</Text>
            <Text style={styles.address_value}>
              {order.delivery_address?.address || "Delivery Address"}
            </Text>
            {order.delivery_address?.landmark ? (
              <Text style={styles.landmark_value}>
                Landmark: {order.delivery_address.landmark}
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TrackFoodOrder;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  // Map
  map_container: {
    height: 310,
    width: "100%",
    position: "relative",
  },
  floating_top_bar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 10,
  },
  back_btn: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#121212d0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff1a",
  },
  // Custom Map Markers
  marker_box_store: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#121212",
  },
  marker_box_rider: {
    backgroundColor: "#2196f3",
    padding: 9,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#2196f3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  marker_box_user: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ffffff44",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  marker_user_dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  // Sheet
  sheet_container: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#121212",
  },
  sheet_content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    gap: 14,
  },
  // Status Card
  status_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  status_top_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  in_transit_badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#4caf5022",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4caf5044",
  },
  badge_error: {
    backgroundColor: "#f4433622",
    borderColor: "#f4433644",
  },
  badge_success: {
    backgroundColor: "#4caf5022",
    borderColor: "#4caf5044",
  },
  live_dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#4caf50",
  },
  in_transit_text: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  order_number_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  status_headline: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
    marginBottom: 4,
  },
  status_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
    marginBottom: 18,
  },
  // Timeline
  timeline_box: {
    paddingVertical: 6,
  },
  timeline_track_container: {
    height: 24,
    justifyContent: "center",
    position: "relative",
  },
  timeline_line_bg: {
    position: "absolute",
    left: 11,
    right: 11,
    height: 3,
    backgroundColor: "#2a2a2a",
    borderRadius: 2,
  },
  timeline_line_fill: {
    position: "absolute",
    left: 11,
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  timeline_steps_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  step_node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  step_node_complete: {
    backgroundColor: "#fff",
  },
  step_node_active: {
    backgroundColor: "#121212",
    borderWidth: 3,
    borderColor: "#fff",
  },
  active_node_inner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  step_node_pending: {
    backgroundColor: "#2a2a2a",
    borderWidth: 2,
    borderColor: "#333",
  },
  timeline_labels_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  step_label_active: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 11,
  },
  step_label_pending: {
    color: "#555",
    fontFamily: "raleway-regular",
    fontSize: 11,
  },

  // Rider Card
  rider_card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  rider_avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#333",
  },
  rider_name: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
    marginBottom: 2,
  },
  rider_vehicle: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  rider_actions: {
    flexDirection: "row",
    gap: 8,
  },
  action_icon_btn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },

  // Details Card
  details_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  restaurant_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  store_icon_box: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurant_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  restaurant_address: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#2a2a2a",
    marginVertical: 14,
  },
  section_subtitle: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
    marginBottom: 12,
  },

  // Item List Rows with Images
  item_card_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  item_image: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
  },
  item_image_placeholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  item_name_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  item_options_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
  item_qty_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 11,
    marginTop: 2,
  },
  item_price_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
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
  breakdown_value: {
    color: "#aaa",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  total_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  total_label: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  total_value: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
  },

  // Address Card
  address_card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  address_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  address_value: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  landmark_value: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginTop: 2,
  },
});
