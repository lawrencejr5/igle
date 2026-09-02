import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { Image } from "expo-image";

import React, { useState } from "react";
import AppLoading from "../../loadings/AppLoading";
import { useLoading } from "../../context/LoadingContext";
import RewardCard from "../../components/RewardCard";
import { useTaskContext } from "../../context/TaskContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

// Removed mock data; using TaskContext instead

const RewardRoot = () => {
  const insets = useSafeAreaInsets();
  const { appLoading } = useLoading();
  const [refreshing, setRefreshing] = useState(false);
  const { tasks, refresh, claimTask } = useTaskContext();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/home");
    }
  };

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
          <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <Pressable
                style={{ paddingVertical: 15 }}
                onPress={handleBack}
              >
                <Feather name="chevron-left" size={30} color={"#fff"} />
              </Pressable>
              <Text
                style={{
                  fontFamily: "raleway-semibold",
                  color: "#fff",
                  fontSize: 22,
                }}
              >
                Tasks
              </Text>
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: 14,
                  marginTop: 6,
                  fontFamily: "raleway-regular",
                }}
              >
                Complete challenges to earn bonuses and discounts
              </Text>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.scrollContent,
                Platform.OS === "ios" && { paddingBottom: insets.bottom + 80 },
              ]}
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
                    source={require("../../assets/images/icons/task-icon.png")}
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
