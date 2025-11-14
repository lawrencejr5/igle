import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import React, { useState, useCallback, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useDriverContext } from "../../context/DriverContext";
import { useDriverAuthContext } from "../../context/DriverAuthContext";

const ReviewsPage = () => {
  const { driver } = useDriverAuthContext();
  const {
    driverReviews,
    reviewsLoading,
    averageRating,
    ratingsCount,
    fetchDriverReviews,
  } = useDriverContext();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDriverReviews();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchDriverReviews();
    } catch (error) {
      console.log("Error refreshing reviews:", error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchDriverReviews]);

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={16}
          color={i <= rating ? "#FFD700" : "#757575"}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  if (reviewsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          onPress={() => router.push("/(driver)/home")}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reviews & Ratings</Text>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => router.push("/(driver)/home")}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reviews & Ratings</Text>
      </View>

      {/* Rating Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.averageRating}>
            {averageRating ? averageRating.toFixed(1) : "0.0"}
          </Text>
          {renderStars(Math.round(averageRating))}
          <Text style={styles.ratingsCount}>
            {ratingsCount} {ratingsCount === 1 ? "Review" : "Reviews"}
          </Text>
        </View>

        <View style={styles.summaryRight}>
          <View style={styles.infoRow}>
            <Ionicons name="car-sport-outline" size={20} color="#FFFFFF" />
            <Text style={styles.infoText}>
              {driver?.total_trips || 0} Total Trips
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="star" size={20} color="#FFD700" />
            <Text style={styles.infoText}>
              {driver?.rating?.toFixed(1) || "0.0"} Driver Rating
            </Text>
          </View>
        </View>
      </View>

      {/* Reviews List */}
      {driverReviews && driverReviews.length > 0 ? (
        <FlatList
          data={driverReviews}
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
          contentContainerStyle={styles.reviewsList}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewUser}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>Anonymous User</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
                {renderStars(item.rating)}
              </View>

              {item.review && item.review.trim() !== "" && (
                <Text style={styles.reviewText}>{item.review}</Text>
              )}
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="star-outline" size={64} color="#757575" />
          <Text style={styles.emptyStateText}>No reviews yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Complete more rides to receive reviews from passengers
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ReviewsPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
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
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: "raleway-bold",
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#757575",
    fontFamily: "raleway-regular",
    fontSize: 16,
    marginTop: 16,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 20,
  },
  summaryLeft: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#333",
  },
  averageRating: {
    fontSize: 48,
    fontFamily: "raleway-bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  ratingsCount: {
    fontSize: 14,
    fontFamily: "raleway-regular",
    color: "#757575",
  },
  summaryRight: {
    flex: 1,
    justifyContent: "center",
    gap: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "raleway-regular",
    color: "#FFFFFF",
  },
  reviewsList: {
    padding: 20,
    paddingTop: 0,
  },
  reviewCard: {
    backgroundColor: "#242424",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: "raleway-semibold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    fontFamily: "raleway-regular",
    color: "#757575",
  },
  reviewText: {
    fontSize: 14,
    fontFamily: "raleway-regular",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: "raleway-semibold",
    color: "#757575",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: "raleway-regular",
    color: "#666",
    textAlign: "center",
  },
});
