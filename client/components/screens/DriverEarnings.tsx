import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  TransactionItem,
  WithdrawModal,
  styles as sharedStyles,
} from "../earnings/EarningsShared";
import {
  Modal,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

type EarningsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const EarningsModal: React.FC<EarningsModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();

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
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      getWalletBalance("Driver");
      fetchTransactions();
      fetchEarningsStats();
    }
  }, [visible]);

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
      onClose();
    }
  };
  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingTop: insets.top }]}>
          {/* Withdraw Modal - Moved outside FlatList */}
          <WithdrawModal
            visible={withdrawModalVisible}
            onClose={() => setWithdrawModalVisible(false)}
            onWithdraw={handleWithdraw}
            balance={driverWalletBal}
            withdrawLoading={withdrawLoading}
          />

          <View style={styles.header}>
            <Text style={styles.headerText}>Earnings</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={{ padding: 10, paddingTop: 0 }}
              onPress={onClose}
            >
              <FontAwesome6 name="chevron-down" size={24} color={"#fff"} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={transactions}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <TransactionItem item={item} />}
            onEndReached={loadMoreTransactions}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ flexGrow: 1 }}
            ListHeaderComponent={() => (
              <>
                {/* Total earnings */}
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

                {/* Summary */}
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
                    <Text style={styles.statValue}>
                      {driver?.total_trips || 0}
                    </Text>
                  </View>
                </View>

                {/* Recent Transactions Header */}
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
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Shared component styles merged in
  ...sharedStyles,

  // EarningsModal-specific styles
  loaderContainer: {
    padding: 20,
    alignItems: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 15,
  },
  headerText: {
    fontSize: 25,
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
  breakdown: {
    backgroundColor: "#1e1e1e",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
  },
  breakdownText: {
    color: "#fff",
    marginBottom: 5,
    fontFamily: "raleway-regular",
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 10,
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
  closeBtn: {
    marginTop: 15,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 30,
    alignItems: "center",
  },
  closeText: {
    color: "#121212",
    fontFamily: "raleway-bold",
  },
});

export default EarningsModal;
