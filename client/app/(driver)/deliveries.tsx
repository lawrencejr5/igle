import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ScrollView,
  Pressable,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useDriverContext } from "../../context/DriverContext";
import Feather from "@expo/vector-icons/Feather";

const DeliveriesPage = () => {
  const [activeTab, setActiveTab] = useState<
    "in_transit" | "delivered" | "cancelled"
  >("in_transit");

  const {
    ongoingDeliveryData,
    driverDeliveredDeliveries,
    driverCancelledDeliveries,
    fetchActiveDelivery,
    fetchDeliveredDeliveries,
    fetchCancelledDeliveries,
  } = useDriverContext();

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      await fetchActiveDelivery();
      await fetchDeliveredDeliveries(true);
      await fetchCancelledDeliveries(true);
    };
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/(driver)/home")}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
      </View>

      <CategoryTabs
        category={activeTab}
        setCategory={setActiveTab}
        driverCancelledDeliveries={driverCancelledDeliveries}
      />

      {/* In Transit deliveries */}
      {activeTab === "in_transit" &&
        (ongoingDeliveryData ? (
          <InTransitDelivery data={ongoingDeliveryData} />
        ) : (
          <EmptyState message="You don't have any deliveries in transit" />
        ))}

      {/* Delivered deliveries */}
      {activeTab === "delivered" &&
        (driverDeliveredDeliveries && driverDeliveredDeliveries.length > 0 ? (
          <DeliveredDeliveries data={driverDeliveredDeliveries} />
        ) : (
          <EmptyState message="You haven't delivered any packages yet" />
        ))}

      {/* Cancelled deliveries */}
      {activeTab === "cancelled" &&
        (driverCancelledDeliveries && driverCancelledDeliveries.length > 0 ? (
          <CancelledDeliveries data={driverCancelledDeliveries} />
        ) : (
          <EmptyState message="You haven't cancelled any deliveries yet" />
        ))}
    </SafeAreaView>
  );
};

const CategoryTabs = ({
  category,
  setCategory,
  driverCancelledDeliveries,
}: {
  category: "in_transit" | "delivered" | "cancelled";
  setCategory: (cat: "in_transit" | "delivered" | "cancelled") => void;
  driverCancelledDeliveries: any;
}) => {
  const tabs = React.useMemo(() => {
    const baseTabs: Array<"in_transit" | "delivered" | "cancelled"> = [
      "in_transit",
      "delivered",
    ];

    if (driverCancelledDeliveries && driverCancelledDeliveries.length > 0) {
      baseTabs.push("cancelled");
    }

    return baseTabs;
  }, [driverCancelledDeliveries]);

  const getTabLabel = (tab: string) => {
    if (tab === "in_transit") return "In Transit";
    return tab.charAt(0).toUpperCase() + tab.slice(1);
  };

  return (
    <View>
      <ScrollView
        contentContainerStyle={styles.tabsContainer}
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      >
        {tabs.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setCategory(tab)}
            style={[
              styles.tabButton,
              category === tab && styles.activeTabButton,
            ]}
          >
            <Text
              style={[
                styles.tabButtonText,
                category === tab && styles.activeTabButtonText,
              ]}
            >
              {getTabLabel(tab)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const EmptyState = ({ message }: { message: string }) => {
  return (
    <View style={styles.emptyState}>
      <Feather name="package" size={64} color="#757575" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
};

const InTransitDelivery = ({ data }: { data: any }) => {
  const { fetchActiveDelivery } = useDriverContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchActiveDelivery();
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActiveDelivery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "arrived":
      case "picked_up":
      case "in_transit":
        return "#e6a518ff";
      case "delivered":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const sender =
    typeof data.sender === "string"
      ? { name: "Unknown", phone: "" }
      : data.sender || { name: "Unknown", phone: "" };

  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#FFFFFF"
          colors={["#FFFFFF"]}
        />
      }
    >
      <View style={styles.deliveriesList}>
        <View style={styles.deliveryCard}>
          <View style={styles.deliveryHeader}>
            <View style={styles.senderInfo}>
              <Image
                source={
                  sender.profile_pic
                    ? { uri: sender.profile_pic }
                    : require("../../assets/images/user.png")
                }
                style={styles.senderImage}
              />
              <View>
                <Text style={styles.senderName}>
                  {sender.name || "Unknown"}
                </Text>
                {sender.phone && (
                  <Text style={styles.senderPhone}>{sender.phone}</Text>
                )}
              </View>
            </View>
            <Text
              style={[
                styles.deliveryStatus,
                { color: getStatusColor(data.status) },
              ]}
            >
              {data.status === "in_transit"
                ? "In Transit"
                : data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Text>
          </View>

          <View style={styles.deliveryDetails}>
            {/* Package Info */}
            {data.package && (
              <View style={styles.packageInfo}>
                <Feather name="package" size={18} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.packageType}>
                    {data.package.type || "Package"}
                    {data.package.fragile && " (Fragile)"}
                  </Text>
                  {data.package.description && (
                    <Text style={styles.packageDescription}>
                      {data.package.description}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Route Info */}
            <View style={styles.routeContainer}>
              <View style={styles.locationItem}>
                <View style={styles.pickupDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>Pickup</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {data.pickup?.address || "Pickup location"}
                  </Text>
                </View>
              </View>

              <View style={styles.locationDivider} />

              <View style={styles.locationItem}>
                <View style={styles.dropoffSquare} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationLabel}>Drop-off</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {data.dropoff?.address || "Dropoff location"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Recipient Info */}
            {data.to && (
              <View style={styles.recipientInfo}>
                <Ionicons name="person-outline" size={18} color="#9e9e9e" />
                <View>
                  <Text style={styles.recipientLabel}>Recipient</Text>
                  <Text style={styles.recipientName}>{data.to.name}</Text>
                  {data.to.phone && (
                    <Text style={styles.recipientPhone}>{data.to.phone}</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={styles.deliveryFooter}>
            <Text style={styles.amount}>
              ₦{data.fare?.toLocaleString() || "0"}
            </Text>
            <Text style={styles.time}>
              {new Date(data.createdAt || data.updatedAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const DeliveredDeliveries = ({ data }: { data: any }) => {
  const {
    fetchDeliveredDeliveries,
    fetchMoreDeliveredDeliveries,
    deliveredLoadingMore,
  } = useDriverContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDeliveredDeliveries(true);
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDeliveredDeliveries]);

  const onEndReached = async () => {
    await fetchMoreDeliveredDeliveries();
  };

  const getStatusColor = () => {
    return "#4CAF50";
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
          />
        }
        contentContainerStyle={styles.deliveriesList}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item }: any) => {
          const sender =
            typeof item.sender === "string"
              ? { name: "Unknown", phone: "" }
              : item.sender || { name: "Unknown", phone: "" };

          return (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.senderInfo}>
                  <Image
                    source={
                      sender.profile_pic
                        ? { uri: sender.profile_pic }
                        : require("../../assets/images/user.png")
                    }
                    style={styles.senderImage}
                  />
                  <View>
                    <Text style={styles.senderName}>
                      {sender.name || "Unknown"}
                    </Text>
                    {sender.phone && (
                      <Text style={styles.senderPhone}>{sender.phone}</Text>
                    )}
                  </View>
                </View>
                <Text
                  style={[styles.deliveryStatus, { color: getStatusColor() }]}
                >
                  Delivered
                </Text>
              </View>

              <View style={styles.deliveryDetails}>
                {/* Package Info */}
                {item.package && (
                  <View style={styles.packageInfo}>
                    <Feather name="package" size={18} color="#fff" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.packageType}>
                        {item.package.type || "Package"}
                        {item.package.fragile && " (Fragile)"}
                      </Text>
                      {item.package.description && (
                        <Text style={styles.packageDescription}>
                          {item.package.description}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Route Info */}
                <View style={styles.routeContainer}>
                  <View style={styles.locationItem}>
                    <View style={styles.pickupDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationLabel}>Pickup</Text>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.pickup?.address || "Pickup location"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationDivider} />

                  <View style={styles.locationItem}>
                    <View style={styles.dropoffSquare} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationLabel}>Drop-off</Text>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.dropoff?.address || "Dropoff location"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recipient Info */}
                {item.to && (
                  <View style={styles.recipientInfo}>
                    <Ionicons name="person-outline" size={18} color="#9e9e9e" />
                    <View>
                      <Text style={styles.recipientLabel}>Recipient</Text>
                      <Text style={styles.recipientName}>{item.to.name}</Text>
                      {item.to.phone && (
                        <Text style={styles.recipientPhone}>
                          {item.to.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.deliveryFooter}>
                <Text style={styles.amount}>
                  ₦{item.fare?.toLocaleString() || "0"}
                </Text>
                <Text style={styles.time}>
                  {new Date(item.createdAt || item.updatedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={() =>
          deliveredLoadingMore ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ color: "#757575", fontFamily: "raleway-regular" }}>
                Loading more...
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const CancelledDeliveries = ({ data }: { data: any }) => {
  const {
    fetchCancelledDeliveries,
    fetchMoreCancelledDeliveries,
    cancelledDeliveriesLoadingMore,
  } = useDriverContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCancelledDeliveries(true);
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCancelledDeliveries]);

  const onEndReached = async () => {
    await fetchMoreCancelledDeliveries();
  };

  const getStatusColor = () => {
    return "#F44336";
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
            colors={["#FFFFFF"]}
          />
        }
        contentContainerStyle={styles.deliveriesList}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item }: any) => {
          const sender =
            typeof item.sender === "string"
              ? { name: "Unknown", phone: "" }
              : item.sender || { name: "Unknown", phone: "" };

          return (
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryHeader}>
                <View style={styles.senderInfo}>
                  <Image
                    source={
                      sender.profile_pic
                        ? { uri: sender.profile_pic }
                        : require("../../assets/images/user.png")
                    }
                    style={styles.senderImage}
                  />
                  <View>
                    <Text style={styles.senderName}>
                      {sender.name || "Unknown"}
                    </Text>
                    {sender.phone && (
                      <Text style={styles.senderPhone}>{sender.phone}</Text>
                    )}
                  </View>
                </View>
                <Text
                  style={[styles.deliveryStatus, { color: getStatusColor() }]}
                >
                  Cancelled
                </Text>
              </View>

              <View style={styles.deliveryDetails}>
                {/* Package Info */}
                {item.package && (
                  <View style={styles.packageInfo}>
                    <Feather name="package" size={18} color="#fff" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.packageType}>
                        {item.package.type || "Package"}
                        {item.package.fragile && " (Fragile)"}
                      </Text>
                      {item.package.description && (
                        <Text style={styles.packageDescription}>
                          {item.package.description}
                        </Text>
                      )}
                    </View>
                  </View>
                )}

                {/* Route Info */}
                <View style={styles.routeContainer}>
                  <View style={styles.locationItem}>
                    <View style={styles.pickupDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationLabel}>Pickup</Text>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.pickup?.address || "Pickup location"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationDivider} />

                  <View style={styles.locationItem}>
                    <View style={styles.dropoffSquare} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.locationLabel}>Drop-off</Text>
                      <Text style={styles.locationText} numberOfLines={1}>
                        {item.dropoff?.address || "Dropoff location"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Recipient Info */}
                {item.to && (
                  <View style={styles.recipientInfo}>
                    <Ionicons name="person-outline" size={18} color="#9e9e9e" />
                    <View>
                      <Text style={styles.recipientLabel}>Recipient</Text>
                      <Text style={styles.recipientName}>{item.to.name}</Text>
                      {item.to.phone && (
                        <Text style={styles.recipientPhone}>
                          {item.to.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.deliveryFooter}>
                <Text style={styles.time}>
                  {new Date(item.createdAt || item.updatedAt).toLocaleString()}
                </Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={() =>
          cancelledDeliveriesLoadingMore ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ color: "#757575", fontFamily: "raleway-regular" }}>
                Loading more...
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

export default DeliveriesPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "raleway-bold",
    color: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 35,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    marginTop: 10,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: "#242424",
    alignItems: "center",
    marginRight: 10,
  },
  activeTabButton: {
    backgroundColor: "#FFFFFF",
  },
  tabButtonText: {
    fontFamily: "raleway-semibold",
    fontSize: 12,
    color: "#FFFFFF",
  },
  activeTabButtonText: {
    color: "#121212",
  },
  deliveriesList: {
    padding: 20,
    paddingTop: 5,
  },
  deliveryCard: {
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  deliveryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  senderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  senderImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  senderName: {
    fontFamily: "raleway-semibold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  senderPhone: {
    fontFamily: "raleway-regular",
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 2,
  },
  deliveryStatus: {
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  deliveryDetails: {
    gap: 12,
    marginBottom: 12,
  },
  packageInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#313131",
    borderRadius: 8,
  },
  packageType: {
    fontFamily: "raleway-semibold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  packageDescription: {
    fontFamily: "raleway-regular",
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 4,
  },
  routeContainer: {
    paddingVertical: 8,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  pickupDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    marginTop: 4,
  },
  dropoffSquare: {
    width: 12,
    height: 12,
    backgroundColor: "#F44336",
    marginTop: 4,
  },
  locationLabel: {
    fontFamily: "raleway-semibold",
    fontSize: 12,
    color: "#9e9e9e",
    marginBottom: 2,
  },
  locationText: {
    fontFamily: "raleway-regular",
    fontSize: 14,
    color: "#FFFFFF",
  },
  locationDivider: {
    width: 2,
    height: 20,
    backgroundColor: "#757575",
    marginLeft: 5,
    marginVertical: 4,
  },
  recipientInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#313131",
    borderRadius: 8,
  },
  recipientLabel: {
    fontFamily: "raleway-semibold",
    fontSize: 12,
    color: "#9e9e9e",
    marginBottom: 2,
  },
  recipientName: {
    fontFamily: "raleway-semibold",
    fontSize: 14,
    color: "#FFFFFF",
  },
  recipientPhone: {
    fontFamily: "raleway-regular",
    fontSize: 12,
    color: "#9e9e9e",
    marginTop: 2,
  },
  deliveryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  amount: {
    fontFamily: "raleway-bold",
    fontSize: 18,
    color: "#4CAF50",
  },
  time: {
    fontFamily: "raleway-regular",
    fontSize: 14,
    color: "#757575",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: "raleway-regular",
    fontSize: 16,
    color: "#757575",
    marginTop: 12,
  },
});
