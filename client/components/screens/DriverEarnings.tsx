import { FontAwesome, FontAwesome6 } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  Pressable,
} from "react-native";
import { useWalletContext } from "../../context/WalletContext";
import { useTransactionContext } from "../../context/TransactionContext";
import { useDriverAuthContext } from "../../context/DriverAuthContext";

type EarningsModalProps = {
  visible: boolean;
  onClose: () => void;
};

const TransactionItem: React.FC<{ item: any }> = ({ item }) => {
  const isEarning = item.type === "driver_payment";
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

const WithdrawModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => void;
  balance: number;
}> = ({ visible, onClose, onWithdraw, balance }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleWithdraw = () => {
    const withdrawAmount = Number(amount);
    if (!amount || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > balance) {
      setError("Insufficient balance");
      return;
    }
    onWithdraw(withdrawAmount);
    setAmount("");
    setError("");
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.withdrawBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.withdrawModal, { marginBottom: 20 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.withdrawTitle}>Withdraw Funds</Text>
          <Text style={styles.withdrawBalance}>
            Available Balance: ₦{balance.toLocaleString()}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.nairaSymbol}>₦</Text>
            <TextInput
              value={amount}
              onChangeText={(text) => {
                setAmount(text.replace(/[^0-9]/g, ""));
                setError("");
              }}
              placeholder="Enter amount"
              placeholderTextColor="#666"
              keyboardType="numeric"
              style={styles.amountInput}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[
              styles.withdrawButton,
              !amount && styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdraw}
            disabled={!amount}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const EarningsModal: React.FC<EarningsModalProps> = ({ visible, onClose }) => {
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
    if (visible) {
      getWalletBalance("Driver");
      fetchTransactions();
      fetchEarningsStats();
    }
  }, [visible]);

  const handleWithdraw = async (amount: number) => {
    try {
      await initiateWithdrawal(amount);
      setWithdrawModalVisible(false);
      // Refresh wallet balance after successful withdrawal
      getWalletBalance("Driver");
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };
  return (
    <Modal transparent visible={visible} animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Withdraw Modal - Moved outside FlatList */}
          <WithdrawModal
            visible={withdrawModalVisible}
            onClose={() => setWithdrawModalVisible(false)}
            onWithdraw={handleWithdraw}
            balance={driverWalletBal}
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
  // Withdraw Modal Styles
  withdrawBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  withdrawModal: {
    backgroundColor: "#1e1e1e",
    width: "85%",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
  },
  withdrawTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "raleway-bold",
    marginBottom: 10,
  },
  withdrawBalance: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "raleway-regular",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2d2d2d",
    borderRadius: 10,
    paddingHorizontal: 15,
    width: "100%",
    height: 50,
  },
  nairaSymbol: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "poppins-bold",
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontFamily: "poppins-bold",
    padding: 0,
  },
  errorText: {
    color: "#F44336",
    fontSize: 14,
    fontFamily: "raleway-regular",
    marginTop: 8,
    alignSelf: "flex-start",
  },
  withdrawButton: {
    backgroundColor: "#fff",
    width: "100%",
    height: 45,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    color: "#121212",
    fontSize: 16,
    fontFamily: "raleway-bold",
  },
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
