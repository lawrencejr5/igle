import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";

import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import RideRoute from "../../components/RideRoute";
import { useDriverContext } from "../../context/DriverContext";

const RidesPage = () => {
  const [activeTab, setActiveTab] = useState<
    "ongoing" | "completed" | "cancelled"
  >("ongoing");

  const {
    ongoingRideData,
    driverCompletedRides,
    driverCancelledRides,
    fetchActiveRide,
    fetchCompletedRides,
    fetchCancelledRides,
  } = useDriverContext();

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      await fetchActiveRide();
      await fetchCompletedRides(true);
      await fetchCancelledRides(true);
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
        <Text style={styles.headerTitle}>My Rides</Text>
      </View>

      <CategoryTabs
        category={activeTab}
        setCategory={setActiveTab}
        driverCancelledRides={driverCancelledRides}
      />

      {/* Ongoing rides */}
      {activeTab === "ongoing" &&
        (ongoingRideData ? (
          <OngoingRide data={ongoingRideData} />
        ) : (
          <EmptyState message="You don't have any ongoing rides" />
        ))}

      {/* Completed rides */}
      {activeTab === "completed" &&
        (driverCompletedRides && driverCompletedRides.length > 0 ? (
          <CompletedRides data={driverCompletedRides} />
        ) : (
          <EmptyState message="You haven't completed any rides yet" />
        ))}

      {/* Cancelled rides */}
      {activeTab === "cancelled" &&
        (driverCancelledRides && driverCancelledRides.length > 0 ? (
          <CancelledRides data={driverCancelledRides} />
        ) : (
          <EmptyState message="You haven't cancelled any rides yet" />
        ))}
    </SafeAreaView>
  );
};

const CategoryTabs = ({
  category,
  setCategory,
  driverCancelledRides,
}: {
  category: "ongoing" | "completed" | "cancelled";
  setCategory: (cat: "ongoing" | "completed" | "cancelled") => void;
  driverCancelledRides: any;
}) => {
  const tabs = React.useMemo(() => {
    const baseTabs: Array<"ongoing" | "completed" | "cancelled"> = [
      "ongoing",
      "completed",
    ];

    if (driverCancelledRides && driverCancelledRides.length > 0) {
      baseTabs.push("cancelled");
    }

    return baseTabs;
  }, [driverCancelledRides]);

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
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
      <Ionicons name="car-outline" size={64} color="#757575" />
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
};

const OngoingRide = ({ data }: { data: any }) => {
  const { fetchActiveRide } = useDriverContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchActiveRide();
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActiveRide]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "#e6a518ff";
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#F44336";
      default:
        return "#757575";
    }
  };

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
      <View style={styles.ridesList}>
        <View style={styles.rideCard}>
          <View style={styles.rideHeader}>
            <View style={styles.customerInfo}>
              <Image
                source={require("../../assets/images/user.png")}
                style={styles.customerImage}
              />
              <Text style={styles.customerName}>
                {data.rider?.name || "Unknown"}
              </Text>
            </View>
            <Text
              style={[
                styles.rideStatus,
                { color: getStatusColor(data.status) },
              ]}
            >
              {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
            </Text>
          </View>

          <View style={styles.rideDetails}>
            <RideRoute
              from={data.pickup?.address}
              to={data.destination?.address}
            />
          </View>

          <View style={styles.rideFooter}>
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

const CompletedRides = ({ data }: { data: any }) => {
  const { fetchCompletedRides, fetchMoreCompletedRides, completedLoadingMore } =
    useDriverContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCompletedRides(true);
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCompletedRides]);

  const onEndReached = async () => {
    await fetchMoreCompletedRides();
  };

  const getStatusColor = (status: string) => {
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
        contentContainerStyle={styles.ridesList}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item }: any) => (
          <View style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.customerInfo}>
                <Image
                  source={require("../../assets/images/user.png")}
                  style={styles.customerImage}
                />
                <Text style={styles.customerName}>
                  {item.rider?.name || "Unknown"}
                </Text>
              </View>
              <Text
                style={[
                  styles.rideStatus,
                  { color: getStatusColor(item.status) },
                ]}
              >
                Completed
              </Text>
            </View>

            <View style={styles.rideDetails}>
              <View
                style={{
                  paddingHorizontal: 10,
                  borderRadius: 5,
                  backgroundColor: "#313131",
                }}
              >
                <RideRoute
                  from={item.pickup?.address}
                  to={item.destination?.address}
                />
              </View>
            </View>

            <View style={styles.rideFooter}>
              <Text style={styles.amount}>
                ₦{item.fare?.toLocaleString() || "0"}
              </Text>
              <Text style={styles.time}>
                {new Date(item.createdAt || item.updatedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={() =>
          completedLoadingMore ? (
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

const CancelledRides = ({ data }: { data: any }) => {
  const { fetchCancelledRides, fetchMoreCancelledRides, cancelledLoadingMore } =
    useDriverContext();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchCancelledRides(true);
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCancelledRides]);

  const onEndReached = async () => {
    await fetchMoreCancelledRides();
  };

  const getStatusColor = (status: string) => {
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
        contentContainerStyle={styles.ridesList}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        renderItem={({ item }: any) => (
          <View style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <View style={styles.customerInfo}>
                <Image
                  source={require("../../assets/images/user.png")}
                  style={styles.customerImage}
                />
                <Text style={styles.customerName}>
                  {item.rider?.name || "Unknown"}
                </Text>
              </View>
              <Text
                style={[
                  styles.rideStatus,
                  { color: getStatusColor(item.status) },
                ]}
              >
                Cancelled
              </Text>
            </View>

            <View style={styles.rideDetails}>
              <View style={styles.cancelledDestination}>
                <Ionicons name="location" size={20} color="#fff" />
                <Text style={styles.destinationText}>
                  {item.destination?.address}
                </Text>
              </View>
            </View>

            <View style={styles.rideFooter}>
              <Text style={styles.time}>
                {new Date(item.createdAt || item.updatedAt).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
        ListFooterComponent={() =>
          cancelledLoadingMore ? (
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

export default RidesPage;

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
  ridesList: {
    padding: 20,
    paddingTop: 5,
  },
  rideCard: {
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  customerName: {
    fontFamily: "raleway-semibold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  rideStatus: {
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  rideDetails: {
    marginBottom: 16,
  },
  cancelledDestination: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 5,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: "#313131",
  },
  destinationText: {
    fontFamily: "raleway-bold",
    fontSize: 16,
    color: "#fff",
  },
  locationContainer: {
    gap: 12,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  locationText: {
    fontFamily: "raleway-regular",
    fontSize: 14,
    color: "#FFFFFF",
    flex: 1,
  },
  locationDivider: {
    width: 2,
    height: 20,
    backgroundColor: "#757575",
    marginLeft: 3,
  },
  rideFooter: {
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
