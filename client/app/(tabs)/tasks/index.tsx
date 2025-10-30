import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import React, { useState } from "react";
import AppLoading from "../../../loadings/AppLoading";
import { useLoading } from "../../../context/LoadingContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import Notification from "../../../components/Notification";
import RewardCard from "../../../components/RewardCard";
import type { RewardInstance } from "../../../types/rewards";

// Mock data - will be replaced with real API data later
const MOCK_REWARDS: RewardInstance[] = [
  {
    id: "rides-10-bonus",
    title: "First 10 Rides",
    description:
      "Complete your first 10 rides and get a bonus credited to your wallet!",
    target: 10,
    progress: 7,
    source: "rides_completed",
    status: "in_progress",
    action: { type: "credit_wallet", currency: "NGN", amount: 2000 },
    terms: "New users only. One-time bonus. Valid for completed paid rides.",
    icon: "🚗",
  },
  {
    id: "weekly-streak-5",
    title: "5-Week Streak",
    description: "Ride at least once per week for 5 consecutive weeks.",
    target: 5,
    progress: 5,
    source: "weekly_streak",
    status: "completed",
    action: { type: "promo_code", code: "STREAK5X" },
    terms: "Minimum 1 ride per week. Streak resets if you miss a week.",
    icon: "🔥",
  },
  {
    id: "deliveries-20",
    title: "20 Deliveries",
    description:
      "Complete 20 deliveries to unlock a special discount on your next ride.",
    target: 20,
    progress: 12,
    source: "deliveries_completed",
    status: "in_progress",
    action: { type: "discount", percentage: 25 },
    terms:
      "Valid for completed deliveries only. Discount applies to next ride.",
    icon: "📦",
  },
  {
    id: "referrals-3",
    title: "Refer 3 Friends",
    description: "Invite 3 friends who complete at least one paid ride.",
    target: 3,
    progress: 1,
    source: "referrals",
    status: "in_progress",
    action: { type: "credit_wallet", currency: "NGN", amount: 5000 },
    terms:
      "Friends must complete at least one paid ride. No limit on referrals.",
    icon: "👥",
  },
  {
    id: "early-bird",
    title: "Early Bird Special",
    description: "You claimed this bonus during our early access program!",
    target: 1,
    progress: 1,
    source: "rides_completed",
    status: "claimed",
    action: { type: "credit_wallet", currency: "NGN", amount: 1000 },
    icon: "🎉",
  },
];

const RewardRoot = () => {
  const { appLoading } = useLoading();
  const { notification } = useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);
  const [rewards] = useState<RewardInstance[]>(MOCK_REWARDS);

  const onRefresh = () => {
    setRefreshing(true);
    // TODO: Fetch rewards from API
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleClaim = (id: string) => {
    // TODO: Implement claim logic with API
    console.log("Claiming reward:", id);
  };

  const activeRewards = rewards.filter((r) => r.status !== "claimed");
  const claimedRewards = rewards.filter((r) => r.status === "claimed");

  return (
    <>
      {appLoading ? (
        <AppLoading />
      ) : (
        <>
          {notification.visible && <Notification notification={notification} />}
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerText}>Tasks</Text>
              <Text style={styles.headerSubtext}>
                Complete challenges to earn bonuses and discounts
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#22C55E"
                  colors={["#22C55E"]}
                />
              }
            >
              {/* Active Rewards */}
              {activeRewards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Available Rewards</Text>
                  {activeRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      onClaim={handleClaim}
                    />
                  ))}
                </View>
              )}

              {/* Claimed Rewards */}
              {claimedRewards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Claimed Rewards</Text>
                  {claimedRewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      onClaim={handleClaim}
                    />
                  ))}
                </View>
              )}

              {/* Empty State */}
              {rewards.length === 0 && (
                <View style={styles.emptyState}>
                  <Image
                    source={require("../../../assets/images/icons/task-icon.png")}
                    style={styles.emptyEmoji}
                  />
                  <Text style={styles.emptyTitle}>No Tasks Yet</Text>
                  <Text style={styles.emptyText}>
                    Complete rides and deliveries to unlock exciting rewards!
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </>
      )}
    </>
  );
};

export default RewardRoot;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    color: "#fff",
    marginTop: 10,
    fontFamily: "raleway-bold",
    fontSize: 32,
  },
  headerSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 6,
    fontFamily: "raleway-regular",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 16,
    fontFamily: "raleway-semibold",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyEmoji: {
    height: 100,
    width: 100,
    tintColor: "#fff",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "raleway-bold",
    marginBottom: 8,
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 40,
    fontFamily: "raleway-regular",
  },
});
