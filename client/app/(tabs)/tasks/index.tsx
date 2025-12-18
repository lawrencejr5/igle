import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";

import React, { useState } from "react";
import AppLoading from "../../../loadings/AppLoading";
import { useLoading } from "../../../context/LoadingContext";
import { useNotificationContext } from "../../../context/NotificationContext";
import Notification from "../../../components/Notification";
import RewardCard from "../../../components/RewardCard";
import { useTaskContext } from "../../../context/TaskContext";

// Removed mock data; using TaskContext instead

const RewardRoot = () => {
  const { appLoading } = useLoading();
  const { notification } = useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);
  const { tasks, refresh, claimTask } = useTaskContext();

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleClaim = async (id: string) => {
    await claimTask(id);
  };

  const activeRewards = tasks.filter((r) => r.status !== "claimed");
  const claimedRewards = tasks.filter((r) => r.status === "claimed");

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
                  tintColor="#121212"
                  colors={["#121212"]}
                />
              }
            >
              {/* Active Rewards */}
              {activeRewards.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Available Tasks</Text>
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
                  <Text style={styles.sectionTitle}>Claimed Tasks</Text>
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
              {tasks.length === 0 && (
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
