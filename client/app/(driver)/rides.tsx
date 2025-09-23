import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import RideRoute from "../../components/RideRoute";
import { useDriverContext } from "../../context/DriverContext";

const RidesPage = () => {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [refreshing, setRefreshing] = useState(false);

  const {
    ongoingRideData,
    driverCompletedRides,
    driverCancelledRides,
    fetchActiveRide,
    fetchCompletedRides,
    fetchMoreCompletedRides,
    completedLoadingMore,
    fetchCancelledRides,
    fetchMoreCancelledRides,
    cancelledLoadingMore,
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

  // Get the appropriate data based on active tab
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "ongoing":
        return ongoingRideData ? [ongoingRideData] : [];
      case "completed":
        return driverCompletedRides || [];
      case "cancelled":
        return driverCancelledRides || [];
      default:
        return [];
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      switch (activeTab) {
        case "ongoing":
          await fetchActiveRide();
          break;
        case "completed":
          await fetchCompletedRides(true);
          break;
        case "cancelled":
          await fetchCancelledRides(true);
          break;
      }
    } catch (error) {
      console.log("Error refreshing data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [activeTab]);

  const onEndReached = async () => {
    if (activeTab === "completed") {
      await fetchMoreCompletedRides();
    } else if (activeTab === "cancelled") {
      await fetchMoreCancelledRides();
    }
  };

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

  const renderRideCard = ({ item }: any) => (
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
          style={[styles.rideStatus, { color: getStatusColor(item.status) }]}
        >
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>

      <View style={styles.rideDetails}>
        {item.status === "cancelled" ? (
          <View style={styles.cancelledDestination}>
            <Ionicons name="location" size={20} color="#fff" />
            <Text style={styles.destinationText}>
              {item.destination?.address}
            </Text>
          </View>
        ) : item.status === "completed" ? (
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
        ) : (
          <RideRoute
            from={item.pickup?.address}
            to={item.destination?.address}
          />
        )}
      </View>

      <View style={styles.rideFooter}>
        {item.status !== "cancelled" && (
          <Text style={styles.amount}>
            ₦{item.fare?.toLocaleString() || "0"}
          </Text>
        )}

        <Text style={styles.time}>
          {new Date(item.createdAt || item.updatedAt).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const TabButton = ({ title, isActive, onPress }: any) => (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text
        style={[styles.tabButtonText, isActive && styles.activeTabButtonText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

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

      <View style={styles.tabsContainer}>
        <TabButton
          title="Ongoing"
          isActive={activeTab === "ongoing"}
          onPress={() => setActiveTab("ongoing")}
        />
        <TabButton
          title="Completed"
          isActive={activeTab === "completed"}
          onPress={() => setActiveTab("completed")}
        />
        <TabButton
          title="Cancelled"
          isActive={activeTab === "cancelled"}
          onPress={() => setActiveTab("cancelled")}
        />
      </View>

      <FlatList
        data={getCurrentTabData()}
        renderItem={renderRideCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.ridesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#757575" />
            <Text style={styles.emptyStateText}>No {activeTab} rides</Text>
          </View>
        )}
        ListFooterComponent={() =>
          (activeTab === "completed" && completedLoadingMore) ||
          (activeTab === "cancelled" && cancelledLoadingMore) ? (
            <View style={{ padding: 12, alignItems: "center" }}>
              <Text style={{ color: "#757575" }}>Loading...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
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
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
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
