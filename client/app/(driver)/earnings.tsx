import { Feather, FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useWalletContext } from "../../context/WalletContext";
import { useTransactionContext } from "../../context/TransactionContext";
import { useDriverAuthContext } from "../../context/DriverAuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

const TransactionItem: React.FC<{ item: any }> = ({ item }) => {
  const isEarning = item.type === "payment";
  const date = new Date(item.createdAt);

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { borderColor: isEarning ? "#4CAF50" : "#F44336" },
          ]}
        >
          <FontAwesome
            name={isEarning ? "arrow-down" : "arrow-up"}
            size={14}
            color={isEarning ? "#4CAF50" : "#F44336"}
          />
        </View>
        <View>
          <Text style={styles.transactionTitle}>
            {isEarning ? "Ride Payment" : "Withdrawal"}
          </Text>
          <Text style={styles.transactionDate}>
            {date.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}{" "}
            •{" "}
            {date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          </Text>
        </View>
      </View>
      <Text style={[styles.transactionAmount, { color: "#ffffffff" }]}>
        {isEarning ? "+" : "-"}₦{item.amount.toLocaleString()}
      </Text>
    </View>
  );
};

const EarningsPage: React.FC = () => {
  const { driverWalletBal, getWalletBalance } = useWalletContext();
  const {
    transactions,
    loading,
    fetchTransactions,
    loadMoreTransactions,
    initiateWithdrawal,
    fetchEarningsStats,
    stats,
  } = useTransactionContext();
  const { driver } = useDriverAuthContext();

  useEffect(() => {
    getWalletBalance("Driver");
    fetchTransactions();
    fetchEarningsStats();
  }, []);

  const handleWithdraw = async (amount: number) => {
    try {
      await initiateWithdrawal(amount);
      // Refresh wallet balance after successful withdrawal
      getWalletBalance("Driver");
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  return (
    <SafeAreaView style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Earnings</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          style={{ padding: 10, paddingTop: 5 }}
          onPress={() => router.push("../(driver)/home")}
        >
          <Feather name="x" size={30} color={"#fff"} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <TransactionItem item={item} />}
        onEndReached={loadMoreTransactions}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={() => (
          <>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total Earnings</Text>
              <Text style={styles.totalAmount}>
                ₦{driverWalletBal.toLocaleString()}
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#fff",
                  paddingHorizontal: 20,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginTop: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
                onPress={() => router.push("/(driver)/earnings?withdraw=true")}
              >
                <FontAwesome name="bank" size={14} color="#121212" />
                <Text
                  style={{
                    color: "#121212",
                    fontFamily: "raleway-bold",
                    fontSize: 12,
                  }}
                >
                  Withdraw Funds
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.row}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Today</Text>
                <Text style={styles.statValue}>
                  ₦{stats?.todayEarnings?.toLocaleString() || "0"}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>This Week</Text>
                <Text style={styles.statValue}>
                  ₦{stats?.weekEarnings?.toLocaleString() || "0"}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Trips</Text>
                <Text style={styles.statValue}>{driver?.total_trips || 0}</Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Recent Transactions
            </Text>
          </>
        )}
        ListFooterComponent={() =>
          loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    padding: 20,
    alignItems: "center",
  },
  sheet: {
    backgroundColor: "#121212",
    flex: 1,
    padding: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  headerText: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "raleway-bold",
  },
  totalBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  totalLabel: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "raleway-regular",
  },
  totalAmount: {
    color: "#fff",
    fontSize: 28,
    marginTop: 5,
    fontFamily: "poppins-bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "raleway-regular",
  },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "poppins-bold",
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
    fontFamily: "raleway-bold",
    paddingHorizontal: 20,
  },
  transactionItem: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIcon: {
    borderWidth: 1,
    borderColor: "#F44336",
    width: 32,
    height: 32,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  transactionTitle: {
    color: "#dadadaff",
    fontSize: 15,
    fontFamily: "raleway-bold",
    marginBottom: 4,
  },
  transactionDate: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "raleway-regular",
  },
  transactionAmount: {
    color: "#4CAF50",
    fontSize: 16,
    fontFamily: "poppins-bold",
  },
});

export default EarningsPage;
