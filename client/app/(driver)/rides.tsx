import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import RideRoute from "../../components/RideRoute";

const RidesPage = () => {
  const [activeTab, setActiveTab] = useState("ongoing");
  const [refreshing, setRefreshing] = useState(false);

  // Temporary sample data - replace with real data from your context/API
  const sampleRides = {
    ongoing: [
      {
        id: "1",
        customer: "John Doe",
        pickup: "123 Main St",
        destination: "456 Oak Ave",
        amount: "₦2,500",
        time: new Date(2025, 8, 23, 14, 30),
        status: "ongoing",
      },
    ],
    completed: [
      {
        id: "2",
        customer: "Jane Smith",
        pickup: "789 Pine St",
        destination: "321 Elm St",
        amount: "₦3,200",
        time: new Date(2025, 8, 23, 10, 15),
        status: "completed",
      },
    ],
    cancelled: [
      {
        id: "3",
        customer: "Mike Johnson",
        pickup: "555 Cedar St",
        destination: "Konwea shopping plaza",
        amount: "₦0",
        time: new Date(2025, 8, 22, 18, 45),
        status: "cancelled",
      },
    ],
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Add your refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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
          <Text style={styles.customerName}>{item.customer}</Text>
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
            <Text style={styles.destinationText}>{item.destination}</Text>
          </View>
        ) : item.status === "completed" ? (
          <View
            style={{
              paddingHorizontal: 10,
              borderRadius: 5,
              backgroundColor: "#4b4b4bff",
            }}
          >
            <RideRoute from={item.pickup} to={item.destination} />
          </View>
        ) : (
          <RideRoute from={item.pickup} to={item.destination} />
        )}
      </View>

      <View style={styles.rideFooter}>
        {item.status !== "cancelled" && (
          <Text style={styles.amount}>{item.amount}</Text>
        )}

        <Text style={styles.time}>{new Date(item.time).toLocaleString()}</Text>
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
        data={sampleRides[activeTab as keyof typeof sampleRides]}
        renderItem={renderRideCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ridesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#757575" />
            <Text style={styles.emptyStateText}>No {activeTab} rides</Text>
          </View>
        )}
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
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "raleway-bold",
    color: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
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
    backgroundColor: "#4b4b4bff",
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
