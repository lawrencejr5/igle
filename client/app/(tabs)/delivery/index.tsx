import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";

import React, { useState, useEffect } from "react";
import AppLoading from "../../../loadings/AppLoading";
import { useLoading } from "../../../context/LoadingContext";
import Notification from "../../../components/Notification";
import { useNotificationContext } from "../../../context/NotificationContext";
import {
  useDeliverContext,
  formatRelativeTime,
  getPackageIcon,
  getVehicleIcon,
} from "../../../context/DeliveryContext";
import RideRoute from "../../../components/RideRoute";
import { router } from "expo-router";

const DeliveryRoot = () => {
  const { appLoading } = useLoading();
  const { notification } = useNotificationContext();
  const {
    ongoingDeliveries,
    cancelledDeliveries,
    deliveredDeliveries,
    fetchUserOngoingDeliveries,
    fetchCancelledDeliveries,
    fetchDeliveredDeliveries,
  } = useDeliverContext();

  const [category, setCategory] = useState<
    "in_transit" | "delivered" | "cancelled"
  >("in_transit");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all deliveries on mount
  useEffect(() => {
    const fetchAllDeliveries = async () => {
      try {
        await Promise.all([
          fetchUserOngoingDeliveries(),
          fetchDeliveredDeliveries(),
          fetchCancelledDeliveries(),
        ]);
      } catch (error) {
        console.log("Failed to fetch deliveries on mount:", error);
      }
    };

    fetchAllDeliveries();
  }, []);

  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserOngoingDeliveries(),
        fetchDeliveredDeliveries(),
        fetchCancelledDeliveries(),
      ]);
    } catch (error) {
      console.log("Failed to refresh deliveries:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          {notification.visible && <Notification notification={notification} />}

          <View style={styles.container}>
            <Text style={styles.header_text}>Deliveries</Text>

            <CategoryTabs
              category={category}
              setCategory={setCategory}
              cancelledDeliveries={cancelledDeliveries}
            />

            {/* Content based on category */}
            {category === "in_transit" &&
              (ongoingDeliveries && ongoingDeliveries.length > 0 ? (
                <InTransitDeliveries
                  data={ongoingDeliveries as any}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ) : (
                <EmptyState
                  message="You don't have any deliveries in transit currently"
                  tab="in_transit"
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ))}

            {category === "delivered" &&
              (deliveredDeliveries && deliveredDeliveries.length > 0 ? (
                <DeliveredDeliveries
                  data={deliveredDeliveries}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ) : (
                <EmptyState
                  message="You don't have any delivered packages yet"
                  tab="delivered"
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ))}

            {category === "cancelled" &&
              (cancelledDeliveries && cancelledDeliveries.length > 0 ? (
                <CancelledDeliveries
                  data={cancelledDeliveries}
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ) : (
                <EmptyState
                  message="You don't have any cancelled deliveries"
                  tab="cancelled"
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                />
              ))}
          </View>
        </>
      )}
    </>
  );
};

const CategoryTabs = ({
  category,
  setCategory,
  cancelledDeliveries,
}: {
  category: "in_transit" | "delivered" | "cancelled";
  setCategory: (cat: "in_transit" | "delivered" | "cancelled") => void;
  cancelledDeliveries: any;
}) => {
  // Always show in_transit and delivered
  const baseTabs: Array<"in_transit" | "delivered" | "cancelled"> = [
    "in_transit",
    "delivered",
  ];

  // Conditionally add cancelled tab
  const conditionalTabs: Array<"cancelled"> = [];

  if (cancelledDeliveries && cancelledDeliveries.length > 0) {
    conditionalTabs.push("cancelled");
  }

  // Combine base tabs with conditional tabs
  const tabs = [...baseTabs, ...conditionalTabs];

  // If current category is not in available tabs, switch to in_transit
  React.useEffect(() => {
    if (!tabs.includes(category)) {
      setCategory("in_transit");
    }
  }, [tabs, category, setCategory]);

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
              {tab === "in_transit"
                ? "In Transit"
                : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const EmptyState = ({
  message,
  tab,
  refreshing,
  onRefresh,
}: {
  message: string;
  tab: "in_transit" | "cancelled" | "delivered";
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) => {
  const { setDeliveryStatus } = useDeliverContext();

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#121212"
          colors={["#121212"]}
        />
      }
    >
      <View
        style={{ justifyContent: "center", alignItems: "center", width: "90%" }}
      >
        {tab === "delivered" ? (
          <Image
            source={require("../../../assets/images/icons/empty-delivered.png")}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              tintColor: "#fff",
            }}
          />
        ) : (
          <Image
            source={require("../../../assets/images/icons/empty-delivery.png")}
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
              tintColor: "#fff",
            }}
          />
        )}

        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontFamily: "raleway-bold",
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 10,
          alignItems: "center",
          flex: 1,
        }}
      >
        <Pressable
          style={{
            backgroundColor: "#fff",
            width: 320,
            padding: 10,
            borderRadius: 20,
            marginTop: 10,
          }}
          onPress={() => {
            router.push("../(book)/book_delivery");
          }}
        >
          <Text
            style={{
              color: "#121212",
              fontFamily: "raleway-bold",
              textAlign: "center",
            }}
          >
            Send a package
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const InTransitDeliveries = ({
  data,
  refreshing,
  onRefresh,
}: {
  data: any[];
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) => {
  return (
    <ScrollView
      style={{ flex: 1, marginTop: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#121212"
          colors={["#121212"]}
        />
      }
    >
      {data.map((delivery, index) => (
        <Pressable
          key={delivery._id || index}
          style={styles.delivery_card}
          onPress={() =>
            router.push(`/(tabs)/delivery/delivery_detail/${delivery._id}`)
          }
        >
          {/* Header with status and time */}
          <View style={styles.delivery_header}>
            <View style={styles.status_container}>
              <View style={styles.status_dot} />
              <Text style={styles.status_text}>In Transit</Text>
            </View>
            <Text style={styles.time_text}>
              {formatRelativeTime(
                delivery.timestamps?.picked_up_at || delivery.createdAt
              )}
            </Text>
          </View>

          {/* Route Information */}
          <RideRoute
            from={delivery.pickup?.address || "Pickup location"}
            to={delivery.dropoff?.address || "Dropoff location"}
          />

          {/* Package and Recipient Info */}
          <View style={styles.info_container}>
            <View style={styles.package_info}>
              <Text style={styles.package_icon}>
                {getPackageIcon(delivery.package?.type)}
              </Text>
              <View style={styles.package_details}>
                <Text style={styles.package_description} numberOfLines={1}>
                  {delivery.package?.description || "Package"}
                </Text>
                {delivery.package?.fragile && (
                  <Text style={styles.fragile_text}>⚠️ Fragile</Text>
                )}
              </View>
            </View>
            <View style={styles.recipient_info}>
              <Text style={styles.recipient_label}>To:</Text>
              <Text style={styles.recipient_name}>
                {delivery.to?.name || "Recipient"}
              </Text>
            </View>
          </View>

          {/* Driver and Vehicle Info */}
          <View style={styles.driver_container}>
            <View style={styles.driver_info}>
              <View style={styles.driver_avatar}>
                <Image
                  source={
                    delivery.driver?.user?.profile_img
                      ? { uri: delivery.driver?.user?.profile_img }
                      : require("../../../assets/images/user.png")
                  }
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              </View>
              <View style={styles.driver_details}>
                <Text style={styles.driver_name}>
                  {delivery.driver?.user?.name || "Driver"}
                </Text>
                <Text style={styles.vehicle_info}>
                  {getVehicleIcon(delivery.vehicle)}{" "}
                  {delivery.driver?.vehicle?.brand}{" "}
                  {delivery.driver?.vehicle?.model}
                </Text>
              </View>
            </View>
            <View style={styles.rating_container}>
              <Text style={styles.rating_star}>⭐</Text>
              <Text style={styles.rating_text}>
                {delivery.driver?.rating?.toFixed(1) || "4.5"}
              </Text>
            </View>
          </View>

          {/* Footer with fare and actions */}
          <View style={styles.delivery_footer}>
            <View style={styles.fare_container}>
              <Text style={styles.fare_label}>Fare</Text>
              <Text style={styles.fare_amount}>
                ${delivery.fare?.toFixed(2) || "0.00"}
              </Text>
            </View>
            <Pressable
              style={styles.track_button}
              onPress={() =>
                router.push(`/(tabs)/delivery/delivery_detail/${delivery._id}`)
              }
            >
              <Text style={styles.track_button_text}>Track</Text>
            </Pressable>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const DeliveredDeliveries = ({
  data,
  refreshing,
  onRefresh,
}: {
  data: any[];
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) => {
  return (
    <ScrollView
      style={{ flex: 1, marginTop: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#121212"
          colors={["#121212"]}
        />
      }
    >
      {data.map((delivery, index) => (
        <Pressable
          key={delivery._id || index}
          style={styles.delivery_card}
          onPress={() =>
            router.push(`/(tabs)/delivery/delivery_detail/${delivery._id}`)
          }
        >
          {/* Header with status and time */}
          <View style={styles.delivery_header}>
            <View style={styles.status_container}>
              <View
                style={[styles.status_dot, { backgroundColor: "#00ff88" }]}
              />
              <Text style={[styles.status_text, { color: "#00ff88" }]}>
                Delivered
              </Text>
            </View>
            <Text style={styles.time_text}>
              {formatRelativeTime(
                delivery.timestamps?.delivered_at || delivery.createdAt
              )}
            </Text>
          </View>

          {/* Route Information */}
          <RideRoute
            from={delivery.pickup?.address || "Pickup location"}
            to={delivery.dropoff?.address || "Dropoff location"}
          />

          {/* Package and Recipient Info */}
          <View style={styles.info_container}>
            <View style={styles.package_info}>
              <Text style={styles.package_icon}>
                {getPackageIcon(delivery.package?.type)}
              </Text>
              <View style={styles.package_details}>
                <Text style={styles.package_description} numberOfLines={1}>
                  {delivery.package?.description || "Package"}
                </Text>
                {delivery.package?.fragile && (
                  <Text style={styles.fragile_text}>⚠️ Fragile</Text>
                )}
              </View>
            </View>
            <View style={styles.recipient_info}>
              <Text style={styles.recipient_label}>Delivered to:</Text>
              <Text style={styles.recipient_name}>
                {delivery.to?.name || "Recipient"}
              </Text>
            </View>
          </View>

          {/* Driver and Vehicle Info */}
          <View style={styles.driver_container}>
            <View style={styles.driver_info}>
              <View style={styles.driver_avatar}>
                <Image
                  source={
                    delivery.driver?.user?.profile_img
                      ? { uri: delivery.driver?.user?.profile_img }
                      : require("../../../assets/images/user.png")
                  }
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              </View>
              <View style={styles.driver_details}>
                <Text style={styles.driver_name}>
                  {delivery.driver?.user?.name || "Driver"}
                </Text>
                <Text style={styles.vehicle_info}>
                  {getVehicleIcon(delivery.vehicle)}{" "}
                  {delivery.driver?.vehicle?.brand}{" "}
                  {delivery.driver?.vehicle?.model}
                </Text>
              </View>
            </View>
            <View style={styles.rating_container}>
              <Text style={styles.rating_star}>⭐</Text>
              <Text style={styles.rating_text}>
                {delivery.driver?.rating?.toFixed(1) || "4.5"}
              </Text>
            </View>
          </View>

          {/* Footer with fare and status */}
          <View style={styles.delivery_footer}>
            <View style={styles.fare_container}>
              <Text style={styles.fare_label}>Total Paid</Text>
              <Text style={styles.fare_amount}>
                ${delivery.fare?.toFixed(2) || "0.00"}
              </Text>
            </View>
            <View style={styles.delivered_status}>
              <Text style={styles.delivered_check}>✓</Text>
              <Text style={styles.delivered_text}>Delivered</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const CancelledDeliveries = ({
  data,
  refreshing,
  onRefresh,
}: {
  data: any[];
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}) => {
  return (
    <ScrollView
      style={{ flex: 1, marginTop: 20 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#121212"
          colors={["#121212"]}
        />
      }
    >
      {data.map((delivery, index) => (
        <Pressable
          key={delivery._id || index}
          style={styles.cancelled_card}
          onPress={() =>
            router.push(`/(tabs)/delivery/delivery_detail/${delivery._id}`)
          }
        >
          {/* Header with status and time */}
          <View style={styles.cancelled_header}>
            <View style={styles.status_container}>
              <View
                style={[styles.status_dot, { backgroundColor: "#ff4444" }]}
              />
              <Text style={[styles.status_text, { color: "#ff4444" }]}>
                Cancelled
              </Text>
            </View>
            <Text style={styles.time_text}>
              {formatRelativeTime(
                delivery.timestamps?.cancelled_at || delivery.createdAt
              )}
            </Text>
          </View>

          {/* Package Info */}
          <View style={styles.cancelled_content}>
            <View style={styles.cancelled_package}>
              <Text style={styles.package_icon}>
                {getPackageIcon(delivery.package?.type)}
              </Text>
              <View style={styles.cancelled_package_details}>
                <Text style={styles.cancelled_package_name} numberOfLines={1}>
                  {delivery.package?.description || "Package"}
                </Text>
                <Text style={styles.cancelled_package_type}>
                  {delivery.package?.type?.charAt(0).toUpperCase() +
                    delivery.package?.type?.slice(1) || "Package"}
                </Text>
              </View>
            </View>

            {/* Destination */}
            <View style={styles.cancelled_destination}>
              <View>
                <Text style={styles.destination_label}>From:</Text>
                <Text style={styles.destination_address} numberOfLines={2}>
                  {delivery.pickup?.address || "Pickup"}
                </Text>
              </View>
              <View>
                <Text style={styles.destination_label}>To:</Text>
                <Text style={styles.destination_address} numberOfLines={2}>
                  {delivery.dropoff?.address || "Destination"}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export default DeliveryRoot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  header_text: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "raleway-bold",
    fontSize: 30,
  },
  nav_container: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginVertical: 12,
  },
  nav_box: {
    backgroundColor: "grey",
    zIndex: 500,
    paddingVertical: 7,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: 20,
    marginRight: 16,
  },
  nav_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  nav_box_active: {
    backgroundColor: "#fff",
  },
  nav_text_active: {
    color: "#121212",
  },
  delivery_card: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#4b4b4bff",
    width: "100%",
    borderRadius: 16,
    marginBottom: 16,
    padding: 20,
    backgroundColor: "#1e1e1e",
  },
  delivery_header_text: {
    fontFamily: "poppins-bold",
    color: "#fff",
    fontSize: 12,
  },
  // New styles for delivery cards
  delivery_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  status_container: {
    flexDirection: "row",
    alignItems: "center",
  },
  status_dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00ff88",
    marginRight: 8,
  },
  status_text: {
    color: "#00ff88",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  time_text: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  info_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
  },
  package_info: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  package_icon: {
    fontSize: 24,
    marginRight: 12,
  },
  package_details: {
    flex: 1,
  },
  package_description: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
    marginBottom: 2,
  },
  fragile_text: {
    color: "#ffaa00",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  recipient_info: {
    alignItems: "flex-end",
  },
  recipient_label: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 2,
  },
  recipient_name: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  driver_container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
  },
  driver_info: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  driver_avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  driver_initial: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  driver_details: {
    flex: 1,
  },
  driver_name: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
    marginBottom: 2,
  },
  vehicle_info: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  rating_container: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating_star: {
    fontSize: 14,
    marginRight: 4,
  },
  rating_text: {
    color: "#fff",
    fontFamily: "poppins-medium",
    fontSize: 14,
  },
  delivery_footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fare_container: {
    alignItems: "flex-start",
  },
  fare_label: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 2,
  },
  fare_amount: {
    color: "#fff",
    fontFamily: "poppins-bold",
    fontSize: 18,
  },
  track_button: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  track_button_text: {
    color: "#000",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  delivered_status: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  delivered_check: {
    color: "#00ff88",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 6,
  },
  delivered_text: {
    color: "#00ff88",
    fontFamily: "raleway-semibold",
    fontSize: 14,
  },
  // Cancelled delivery card styles
  cancelled_card: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#4b4b4bff",
    width: "100%",
    borderRadius: 12,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#1e1e1e",
  },
  cancelled_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cancelled_content: {
    marginBottom: 12,
  },
  cancelled_package: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cancelled_package_details: {
    flex: 1,
    marginLeft: 12,
  },
  cancelled_package_name: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 14,
    marginBottom: 2,
  },
  cancelled_package_type: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
  },
  cancelled_destination: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  destination_label: {
    color: "#888",
    fontFamily: "raleway-regular",
    fontSize: 12,
    marginBottom: 2,
  },
  destination_address: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  cancellation_reason: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#2d1f1f",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
  },
  reason_label: {
    color: "#ff6b6b",
    fontFamily: "raleway-regular",
    fontSize: 11,
    marginBottom: 2,
  },
  reason_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
});
