import { Feather, FontAwesome } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  TransactionItem,
  WithdrawModal,
  styles as sharedStyles,
} from "../../components/earnings/EarningsShared";
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
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);

  useEffect(() => {
    getWalletBalance("Driver");
    fetchTransactions("driver_payment");
    fetchEarningsStats();
  }, []);

  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const handleWithdraw = async (amount: number) => {
    setWithdrawLoading(true);
    try {
      await initiateWithdrawal(amount);
      getWalletBalance("Driver");
      setWithdrawModalVisible(false);
    } catch (error) {
      console.error("Withdrawal failed:", error);
    } finally {
      setWithdrawLoading(false);
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

      <WithdrawModal
        visible={withdrawModalVisible}
        onClose={() => setWithdrawModalVisible(false)}
        onWithdraw={handleWithdraw}
        balance={driverWalletBal}
        withdrawLoading={withdrawLoading}
      />

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
                onPress={() => setWithdrawModalVisible(true)}
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
  // shared component styles merged in
  ...sharedStyles,
});

export default EarningsPage;
