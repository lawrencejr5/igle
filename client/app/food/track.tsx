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
import React, { useRef, useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import { darkMapStyle } from "../../data/map.dark";

// ─── Coordinates & Dummy Order Data ──────────────────────────────────────────

const RESTAURANT_LOCATION = {
  latitude: 6.4310,
  longitude: 3.4210,
};

const RIDER_LOCATION = {
  latitude: 6.4390,
  longitude: 3.4310,
};

const USER_LOCATION = {
  latitude: 6.4470,
  longitude: 3.4420,
};

const ROUTE_COORDINATES = [
  RESTAURANT_LOCATION,
  { latitude: 6.4340, longitude: 3.4250 },
  RIDER_LOCATION,
  { latitude: 6.4430, longitude: 3.4360 },
  USER_LOCATION,
];

const INITIAL_REGION = {
  latitude: 6.4390,
  longitude: 3.4315,
  latitudeDelta: 0.032,
  longitudeDelta: 0.032,
};

// ─── Track Food Order Screen ──────────────────────────────────────────────────

const TrackFoodOrder = () => {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  return (
    <View style={styles.container}>
      {/* ── Map Header View ── */}
      <View style={styles.map_container}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={INITIAL_REGION}
          customMapStyle={darkMapStyle}
          onMapReady={() => setIsMapReady(true)}
          toolbarEnabled={false}
        >
          {/* Polyline Route */}
          <Polyline
            coordinates={ROUTE_COORDINATES}
            strokeColor="#ffffff"
            strokeWidth={4}
          />

          {/* Restaurant Marker */}
          <Marker coordinate={RESTAURANT_LOCATION} title="KFC Naija">
            <View style={styles.marker_box_store}>
              <Feather name="shopping-bag" size={14} color="#121212" />
            </View>
          </Marker>

          {/* Dispatch Rider Marker */}
          <Marker
            coordinate={RIDER_LOCATION}
            title="Dispatch Rider (Emmanuel)"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.marker_box_rider}>
              <Feather name="navigation" size={16} color="#fff" />
            </View>
          </Marker>

          {/* User Location Marker */}
          <Marker coordinate={USER_LOCATION} title="Delivery Address">
            <View style={styles.marker_box_user}>
              <View style={styles.marker_user_dot} />
            </View>
          </Marker>
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

          <View style={styles.top_title_badge}>
            <Text style={styles.top_title_text}>Track Order</Text>
          </View>

          <View style={{ width: 45 }} />
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
            <View style={styles.in_transit_badge}>
              <View style={styles.live_dot} />
              <Text style={styles.in_transit_text}>IN TRANSIT</Text>
            </View>
            <Text style={styles.eta_time}>3:15 PM</Text>
          </View>

          <Text style={styles.status_headline}>Your food is on the way!</Text>
          <Text style={styles.status_sub}>
            Rider is approx. 12 minutes away from your location
          </Text>

          {/* Progress Bar Timeline */}
          <View style={styles.timeline_box}>
            <View style={styles.timeline_line} />
            <View
              style={[styles.timeline_progress, { width: "70%" }]}
            />
            <View style={styles.timeline_steps}>
              <View style={[styles.step_node, styles.step_node_complete]}>
                <Feather name="check" size={10} color="#121212" />
              </View>
              <View style={[styles.step_node, styles.step_node_complete]}>
                <Feather name="check" size={10} color="#121212" />
              </View>
              <View style={[styles.step_node, styles.step_node_active]}>
                <View style={styles.active_node_inner} />
              </View>
              <View style={[styles.step_node, styles.step_node_pending]} />
            </View>
            <View style={styles.timeline_labels}>
              <Text style={styles.step_label_active}>Placed</Text>

              <Text style={styles.step_label_active}>Preparing</Text>
              <Text style={styles.step_label_active}>On the Way</Text>
              <Text style={styles.step_label_pending}>Delivered</Text>
            </View>
          </View>
        </View>

        {/* ── Dispatch Rider Card ── */}
        <View style={styles.rider_card}>
          <Image
            source={require("../../assets/images/user.png")}
            style={styles.rider_avatar}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.rider_name}>Emmanuel Okafor</Text>
            <Text style={styles.rider_vehicle}>Honda Ace 125 · Red Bike</Text>
            <View style={styles.rider_rating_row}>
              <Feather name="star" size={12} color="#fff" />
              <Text style={styles.rider_rating_text}>4.9 (420 deliveries)</Text>
            </View>
          </View>
          <View style={styles.rider_actions}>
            <TouchableOpacity
              style={styles.action_icon_btn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="phone" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.action_icon_btn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="message-square" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Restaurant & Order Details ── */}
        <View style={styles.details_card}>
          <View style={styles.restaurant_row}>
            <View style={styles.store_icon_box}>
              <Image
                source={require("../../assets/images/icons/food-icon-fill.png")}
                style={{ width: 18, height: 18, tintColor: "#fff" }}
                contentFit="contain"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurant_title}>KFC Naija</Text>
              <Text style={styles.restaurant_address}>
                88 Isaac John Street, Ikeja GRA
              </Text>
            </View>
            <Text style={styles.order_id}>#FO-98241</Text>
          </View>

          <View style={styles.divider} />

          {/* Items Purchased */}
          <Text style={styles.section_subtitle}>Order Summary</Text>

          <View style={styles.item_row}>
            <Text style={styles.item_qty}>1x</Text>
            <Text style={styles.item_name}>Zinger Chicken Burger</Text>
            <Text style={styles.item_price}>₦3,800</Text>
          </View>

          <View style={styles.item_row}>
            <Text style={styles.item_qty}>2x</Text>
            <Text style={styles.item_name}>Cajun Crispy Chips</Text>
            <Text style={styles.item_price}>₦1,400</Text>
          </View>

          <View style={styles.divider} />

          {/* Payment Breakdown */}
          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Subtotal</Text>
            <Text style={styles.breakdown_value}>₦5,200</Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Delivery Fee</Text>
            <Text style={styles.breakdown_value}>₦500</Text>
          </View>

          <View style={styles.breakdown_row}>
            <Text style={styles.breakdown_label}>Service Fee</Text>
            <Text style={styles.breakdown_value}>₦200</Text>
          </View>

          <View style={styles.total_row}>
            <Text style={styles.total_label}>Total Paid</Text>
            <Text style={styles.total_value}>₦5,900</Text>
          </View>
        </View>

        {/* Delivery Address Card */}
        <View style={styles.address_card}>
          <Feather name="map-pin" size={16} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.address_label}>Deliver To</Text>
            <Text style={styles.address_value}>
              12 Marina Boulevard, Victoria Island, Lagos
            </Text>
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
  top_title_badge: {
    backgroundColor: "#121212d0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ffffff1a",
  },
  top_title_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 15,
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
  eta_time: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
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
    position: "relative",
    paddingVertical: 4,
  },
  timeline_line: {
    position: "absolute",
    top: 9,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: "#2a2a2a",
    borderRadius: 2,
  },
  timeline_progress: {
    position: "absolute",
    top: 9,
    left: 10,
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  timeline_steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 2,
  },
  step_node: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
  timeline_labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  step_label_active: {
    color: "#fff",
    fontFamily: "raleway-semibold",
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
    marginBottom: 3,
  },
  rider_rating_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rider_rating_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 11,
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
    marginBottom: 14,
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
  order_id: {
    color: "#777",
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
  item_row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  item_qty: {
    color: "#9CA3AF",
    fontFamily: "raleway-bold",
    fontSize: 13,
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
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
});
