/**
 * Shared components used by both the earnings modal
 * (components/screens/DriverEarnings.tsx) and the earnings route
 * (app/(driver)/earnings.tsx).
 *
 * Make all UI/logic changes here — both consumers will pick them up
 * automatically.
 */

import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";

// ─── TransactionItem ──────────────────────────────────────────────────────────

export const TransactionItem: React.FC<{ item: any }> = ({ item }) => {
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

// ─── WithdrawModal ────────────────────────────────────────────────────────────

export const WithdrawModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onWithdraw: (amount: number) => Promise<void>;
  balance: number;
  withdrawLoading: boolean;
}> = ({ visible, onClose, onWithdraw, balance, withdrawLoading }) => {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleWithdrawLocal = async () => {
    const withdrawAmount = Number(amount);
    if (!amount || withdrawAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > balance) {
      setError("Insufficient balance");
      return;
    }
    setError("");
    await onWithdraw(withdrawAmount);
    // Modal is closed by the parent on success; reset amount either way
    setAmount("");
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Pressable style={styles.withdrawBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.withdrawModal, { marginBottom: 20 }]}
          onPress={(e) => {
            e.stopPropagation();
            Keyboard.dismiss();
          }}
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
              (!amount || withdrawLoading) && styles.withdrawButtonDisabled,
            ]}
            onPress={handleWithdrawLocal}
            disabled={!amount || withdrawLoading}
          >
            {withdrawLoading ? (
              <ActivityIndicator color="#121212" size="small" />
            ) : (
              <Text style={styles.withdrawButtonText}>Withdraw</Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Shared styles ────────────────────────────────────────────────────────────

export const styles = StyleSheet.create({
  // TransactionItem
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

  // WithdrawModal
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
});
