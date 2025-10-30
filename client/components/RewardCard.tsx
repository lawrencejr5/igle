import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { RewardInstance } from "../types/rewards";
import ProgressBar from "./ProgressBar";

interface Props {
  reward: RewardInstance;
  onClaim: (id: string) => void;
}

const RewardCard: React.FC<Props> = ({ reward, onClaim }) => {
  const pct = Math.min(1, reward.progress / reward.target);
  const canClaim = reward.status === "completed";
  const claimed = reward.status === "claimed";
  const expired = reward.status === "expired";
  const inProgress = reward.status === "in_progress";

  const getStatusText = () => {
    if (claimed) return "✓ Claimed";
    if (expired) return "Expired";
    if (canClaim) return "🎉 Ready to claim";
    if (inProgress) return "In progress";
    return "Locked";
  };

  const getRewardText = () => {
    if (reward.action.type === "credit_wallet") {
      return `${
        reward.action.currency
      } ${reward.action.amount.toLocaleString()}`;
    }
    if (reward.action.type === "promo_code") {
      return `Promo Code`;
    }
    if (reward.action.type === "discount") {
      return `${reward.action.percentage}% Off`;
    }
    return "Reward";
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.emoji}>{reward.icon || "🎁"}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>{reward.title}</Text>
            <Text style={styles.rewardAmount}>{getRewardText()}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            canClaim && styles.statusBadgeReady,
            claimed && styles.statusBadgeClaimed,
          ]}
        >
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{reward.description}</Text>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressNumbers}>
            {Math.min(reward.progress, reward.target)} / {reward.target}
          </Text>
        </View>
        <ProgressBar
          value={pct}
          height={10}
          trackColor="rgba(255,255,255,0.12)"
          fillColor="#FFFFFF"
        />
        <Text style={styles.progressPercent}>
          {Math.round(pct * 100)}% Complete
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {reward.terms && <Text style={styles.terms}>{reward.terms}</Text>}

        <TouchableOpacity
          disabled={!canClaim}
          onPress={() => onClaim(reward.id)}
          style={[
            styles.claimButton,
            !canClaim && styles.claimButtonDisabled,
            claimed && styles.claimButtonClaimed,
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.claimButtonText,
              !canClaim && styles.claimButtonTextDisabled,
            ]}
          >
            {claimed ? "Claimed ✓" : canClaim ? "Claim Reward" : "Keep Going!"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  emoji: {
    fontSize: 25,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "raleway-bold",
    marginBottom: 4,
  },
  rewardAmount: {
    color: "#22C55E",
    fontSize: 14,
    fontFamily: "raleway-semibold",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
  },
  statusBadgeReady: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
  },
  statusBadgeClaimed: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  statusText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontFamily: "raleway-semibold",
  },
  description: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 16,
    fontFamily: "raleway-regular",
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "raleway-semibold",
  },
  progressNumbers: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "raleway-bold",
  },
  progressPercent: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 6,
  },
  footer: {
    gap: 12,
  },
  terms: {
    color: "#6B7280",
    fontSize: 11,
    lineHeight: 16,
    fontStyle: "italic",
  },
  claimButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  claimButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  claimButtonClaimed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  claimButtonText: {
    color: "#121212",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
  claimButtonTextDisabled: {
    color: "#6B7280",
  },
});

export default RewardCard;
