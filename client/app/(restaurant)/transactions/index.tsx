import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRestaurantContext } from "../../../context/RestaurantContext";
import { useTransactionContext } from "../../../context/TransactionContext";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface RestaurantTransaction {
  id: string;
  reference: string;
  type: "food_payment" | "payout" | "restaurant_refund" | "commission";
  direction: "in" | "out";
  amount: number;
  status: "success" | "pending" | "failed";
  channel: "wallet" | "transfer" | "card";
  title: string;
  subtitle: string;
  date: string;
  timestamp: string;
  order_number?: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
}

type FilterType = "all" | "in" | "out";

// ─── Restaurant Transactions Screen ───────────────────────────────────────────

const RestaurantTransactions = () => {
  const insets = useSafeAreaInsets();
  const { restaurant } = useRestaurantContext();
  const {
    vendorTransactions: ctxVendorTxns,
    vendorStats,
    fetchVendorTransactions,
    fetchVendorEarningsStats,
    initiateVendorWithdrawal,
  } = useTransactionContext();

  const [transactions, setTransactions] = useState<RestaurantTransaction[]>([]);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Withdrawal Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Transaction Details Modal State
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<RestaurantTransaction | null>(
    null,
  );

  React.useEffect(() => {
    fetchVendorTransactions();
    fetchVendorEarningsStats();
  }, []);

  React.useEffect(() => {
    if (ctxVendorTxns && Array.isArray(ctxVendorTxns)) {
      // Only display transactions that belong to the vendor wallet (vendor earnings & vendor payouts)
      const vendorTxns = ctxVendorTxns.filter((t: any) => {
        const isEarnings =
          t.type === "vendor_earnings" ||
          t.metadata?.type === "food_order_earnings" ||
          t.metadata?.restaurant_id;

        const isVendorPayout =
          t.type === "payout" ||
          t.type === "withdrawal" ||
          t.metadata?.type === "vendor_withdrawal";

        const isCustomerSpending =
          t.type === "food_payment" &&
          t.metadata?.type !== "food_order_earnings" &&
          !t.metadata?.restaurant_id;

        return (isEarnings || isVendorPayout) && !isCustomerSpending;
      });

      const mapped: RestaurantTransaction[] = vendorTxns.map((t: any) => {
        const isPayout =
          t.type === "payout" ||
          t.type === "withdrawal" ||
          t.metadata?.type === "vendor_withdrawal";

        const orderNum =
          t.metadata?.order_number ||
          (t.food_order_id
            ? `IGL-${t._id.slice(-5).toUpperCase()}`
            : undefined);

        return {
          id: t._id,
          reference: t.reference || `TXN-${t._id.slice(-6).toUpperCase()}`,
          type: isPayout ? "payout" : "food_payment",
          direction: isPayout ? "out" : "in",
          amount: t.amount,
          status: t.status as "success" | "pending" | "failed",
          channel: (t.channel as any) || "wallet",
          title: isPayout
            ? "Bank Payout Withdrawal"
            : `Food Order Sales ${orderNum ? `#${orderNum}` : ""}`,
          subtitle: isPayout
            ? `${restaurant?.bank?.bank_name || "Bank"} Account`
            : "Customer Order Earnings",
          date: new Date(t.createdAt).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          timestamp: t.createdAt,
          order_number: orderNum,
          bank_details: restaurant?.bank
            ? {
                bank_name: restaurant.bank.bank_name,
                account_number: restaurant.bank.account_number,
                account_name: restaurant.bank.account_name,
              }
            : undefined,
        };
      });

      setTransactions(mapped);
    }
  }, [ctxVendorTxns, restaurant?.bank]);

  // Wallet Metrics
  const withdrawableBalance =
    vendorStats.withdrawableBalance ?? vendorStats.todayEarnings ?? 0;
  const pendingBalance = vendorStats.pendingBalance ?? 0;
  const todayEarnings = vendorStats.todayEarnings || 0;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOpenWithdrawModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWithdrawAmount("");
    setWithdrawModalVisible(true);
  };

  const handleQuickAmount = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWithdrawAmount(amount.toString());
  };

  const handleConfirmWithdraw = async () => {
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmittingWithdraw(true);

    await initiateVendorWithdrawal(amountNum);
    setIsSubmittingWithdraw(false);
    setWithdrawModalVisible(false);
    setWithdrawAmount("");
  };

  const handleOpenTxnDetails = (txn: RestaurantTransaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTxn(txn);
    setDetailsModalVisible(true);
  };

  // ── Filtered Data ───────────────────────────────────────────────────────────

  const getFilteredTransactions = (): RestaurantTransaction[] => {
    let result = [...transactions];

    if (filterType === "in") {
      result = result.filter((t) => t.direction === "in");
    } else if (filterType === "out") {
      result = result.filter((t) => t.direction === "out");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          (t.order_number && t.order_number.toLowerCase().includes(q)) ||
          t.subtitle.toLowerCase().includes(q),
      );
    }

    return result;
  };

  const filteredTransactions = getFilteredTransactions();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? insets.top + 10 : insets.top + 14,
        },
      ]}
    >
      {/* ── Top Nav Bar ── */}
      <View style={styles.top_nav}>
        <TouchableOpacity
          style={styles.nav_icon_btn}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.header_center}>
          <Text style={styles.header_title}>Wallet & Transactions</Text>
          <Text style={styles.header_sub}>
            {restaurant?.name || "Restaurant Store"}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll_content,
          { paddingBottom: Platform.OS === "ios" ? insets.bottom + 40 : 50 },
        ]}
      >
        {/* ── Withdrawable Balance Hero Card ── */}
        <View style={styles.balance_card}>
          <View style={styles.balance_header}>
            <View style={styles.balance_label_row}>
              <Ionicons name="wallet-outline" size={18} color="#9CA3AF" />
              <Text style={styles.balance_label_text}>
                WITHDRAWABLE BALANCE
              </Text>
            </View>
            <View style={styles.live_status_pill}>
              <Text style={styles.live_status_text}>Ready to Withdraw</Text>
            </View>
          </View>

          <Text style={styles.balance_amount_text}>
            ₦{withdrawableBalance.toLocaleString()}
            <Text style={styles.kobo_text}>.00</Text>
          </Text>

          {/* Quick Stats Grid */}
          <View style={styles.stats_row}>
            <View style={styles.stat_item}>
              <Text style={styles.stat_label}>TOTAL ORDERS</Text>
              <Text style={styles.stat_value_green}>
                {vendorStats.totalOrders}
              </Text>
            </View>
            <View style={styles.stat_divider} />
            <View style={styles.stat_item}>
              <Text style={styles.stat_label}>PENDING ORDERS SALES</Text>
              <Text
                style={{
                  color: "#ffb74d",
                  fontFamily: "raleway-bold",
                  fontSize: 15,
                }}
              >
                ₦{pendingBalance.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Withdraw Action Button */}
          <TouchableOpacity
            style={styles.withdraw_btn}
            activeOpacity={0.88}
            onPress={handleOpenWithdrawModal}
          >
            <Feather name="arrow-up-right" size={18} color="#121212" />
            <Text style={styles.withdraw_btn_text}>Withdraw to Bank</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search & Filter Controls ── */}
        <View style={styles.filter_section}>
          <View style={styles.search_box}>
            <Feather name="search" size={16} color="#777" />
            <TextInput
              style={styles.search_input}
              placeholder="Search reference, order #..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color="#777" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filter_chips_row}>
            <TouchableOpacity
              style={[
                styles.filter_chip,
                filterType === "all" && styles.filter_chip_active,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterType("all");
              }}
            >
              <Text
                style={[
                  styles.filter_chip_text,
                  filterType === "all" && styles.filter_chip_text_active,
                ]}
              >
                All ({transactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filter_chip,
                filterType === "in" && styles.filter_chip_active,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterType("in");
              }}
            >
              <Text
                style={[
                  styles.filter_chip_text,
                  filterType === "in" && styles.filter_chip_text_active,
                ]}
              >
                Money In 🟢 (
                {transactions.filter((t) => t.direction === "in").length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filter_chip,
                filterType === "out" && styles.filter_chip_active,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterType("out");
              }}
            >
              <Text
                style={[
                  styles.filter_chip_text,
                  filterType === "out" && styles.filter_chip_text_active,
                ]}
              >
                Money Out 🔴 (
                {transactions.filter((t) => t.direction === "out").length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Transaction History List ── */}
        <View style={styles.txn_list_container}>
          <Text style={styles.section_title}>Transaction History</Text>

          {filteredTransactions.length === 0 ? (
            <View style={styles.empty_state}>
              <Feather name="file-text" size={36} color="#444" />
              <Text style={styles.empty_title}>No Transactions Found</Text>
              <Text style={styles.empty_sub}>
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No payment history under this filter."}
              </Text>
            </View>
          ) : (
            filteredTransactions.map((txn) => {
              const isIncome = txn.direction === "in";

              return (
                <TouchableOpacity
                  key={txn.id}
                  style={styles.txn_card}
                  activeOpacity={0.88}
                  onPress={() => handleOpenTxnDetails(txn)}
                >
                  <View style={styles.txn_left}>
                    {/* Icon Circle */}
                    <View
                      style={[
                        styles.icon_circle,
                        isIncome
                          ? styles.icon_circle_in
                          : styles.icon_circle_out,
                      ]}
                    >
                      <Feather
                        name={isIncome ? "arrow-down-left" : "arrow-up-right"}
                        size={18}
                        color={isIncome ? "#4caf50" : "#ef5350"}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.txn_title} numberOfLines={1}>
                        {txn.title}
                      </Text>
                      <Text style={styles.txn_sub} numberOfLines={1}>
                        {txn.subtitle}
                      </Text>
                      <Text style={styles.txn_date_text}>{txn.date}</Text>
                    </View>
                  </View>

                  <View style={styles.txn_right}>
                    <Text
                      style={[
                        styles.txn_amount_text,
                        isIncome ? styles.amount_green : styles.amount_red,
                      ]}
                    >
                      {isIncome ? "+" : "-"}₦{txn.amount.toLocaleString()}
                    </Text>
                    <View style={styles.txn_status_badge}>
                      <Text style={styles.txn_status_text}>Successful</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Withdrawal Modal ── */}
      <Modal
        visible={withdrawModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modal_backdrop}>
          <View style={styles.modal_card}>
            <View style={styles.modal_header}>
              <Text style={styles.modal_title}>Withdraw to Bank</Text>
              <TouchableOpacity onPress={() => setWithdrawModalVisible(false)}>
                <Feather name="x" size={20} color="#aaa" />
              </TouchableOpacity>
            </View>

            {/* Bank Preview */}
            <View style={styles.bank_preview_box}>
              <FontAwesome5 name="university" size={18} color="#9CA3AF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bank_name_text}>
                  {restaurant?.bank?.bank_name || "GTBank"}
                </Text>
                <Text style={styles.bank_acc_text}>
                  {restaurant?.bank?.account_number || "0123455821"} •{" "}
                  {restaurant?.bank?.account_name ||
                    restaurant?.name ||
                    "STORE ACCOUNT"}
                </Text>
              </View>
            </View>

            {/* Input */}
            <Text style={styles.input_label}>ENTER AMOUNT (₦)</Text>
            <TextInput
              style={styles.text_input}
              placeholder="e.g. 20000"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
            />

            {/* Quick Amount Chips */}
            <View style={styles.quick_chip_row}>
              <TouchableOpacity
                style={styles.quick_chip}
                onPress={() => handleQuickAmount(10000)}
              >
                <Text style={styles.quick_chip_text}>₦10,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quick_chip}
                onPress={() => handleQuickAmount(25000)}
              >
                <Text style={styles.quick_chip_text}>₦25,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quick_chip}
                onPress={() => handleQuickAmount(50000)}
              >
                <Text style={styles.quick_chip_text}>₦50,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quick_chip}
                onPress={() => handleQuickAmount(withdrawableBalance)}
              >
                <Text style={styles.quick_chip_text}>Max</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modal_footer}>
              <TouchableOpacity
                style={styles.modal_cancel_btn}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.modal_cancel_text}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modal_confirm_btn,
                  isSubmittingWithdraw && { opacity: 0.6 },
                ]}
                disabled={isSubmittingWithdraw}
                onPress={handleConfirmWithdraw}
              >
                <Text style={styles.modal_confirm_text}>
                  {isSubmittingWithdraw ? "Processing..." : "Confirm Payout"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Transaction Details Modal Sheet ── */}
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View
          style={[
            styles.sheet_container,
            { paddingTop: Platform.OS === "ios" ? insets.top + 10 : 20 },
          ]}
        >
          <View style={styles.sheet_header}>
            <TouchableOpacity
              style={styles.sheet_close_btn}
              onPress={() => setDetailsModalVisible(false)}
            >
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.sheet_title}>Transaction Receipt</Text>
            <View style={{ width: 36 }} />
          </View>

          {selectedTxn && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.sheet_scroll_content,
                {
                  paddingBottom:
                    Platform.OS === "ios" ? insets.bottom + 40 : 50,
                },
              ]}
            >
              <View style={styles.receipt_header}>
                <View
                  style={[
                    styles.receipt_icon_box,
                    selectedTxn.direction === "in"
                      ? styles.icon_circle_in
                      : styles.icon_circle_out,
                  ]}
                >
                  <Feather
                    name={
                      selectedTxn.direction === "in"
                        ? "arrow-down-left"
                        : "arrow-up-right"
                    }
                    size={28}
                    color={
                      selectedTxn.direction === "in" ? "#4caf50" : "#ef5350"
                    }
                  />
                </View>
                <Text style={styles.receipt_amount}>
                  {selectedTxn.direction === "in" ? "+" : "-"}₦
                  {selectedTxn.amount.toLocaleString()}
                </Text>
                <Text style={styles.receipt_status_tag}>
                  Successful Transaction
                </Text>
              </View>

              <View style={styles.receipt_box}>
                <Text style={styles.receipt_section_title}>DETAILS</Text>

                <View style={styles.receipt_row}>
                  <Text style={styles.receipt_label}>Transaction Type</Text>
                  <Text style={styles.receipt_value}>{selectedTxn.title}</Text>
                </View>

                <View style={styles.receipt_row}>
                  <Text style={styles.receipt_label}>Reference</Text>
                  <Text style={styles.receipt_value_code}>
                    {selectedTxn.reference}
                  </Text>
                </View>

                {selectedTxn.order_number && (
                  <View style={styles.receipt_row}>
                    <Text style={styles.receipt_label}>Food Order #</Text>
                    <Text style={styles.receipt_value_bold}>
                      {selectedTxn.order_number}
                    </Text>
                  </View>
                )}

                <View style={styles.receipt_row}>
                  <Text style={styles.receipt_label}>Payment Channel</Text>
                  <Text style={styles.receipt_value}>
                    {selectedTxn.channel.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.receipt_row}>
                  <Text style={styles.receipt_label}>Date & Time</Text>
                  <Text style={styles.receipt_value}>{selectedTxn.date}</Text>
                </View>

                {selectedTxn.bank_details && (
                  <>
                    <View style={styles.receipt_divider} />
                    <Text style={styles.receipt_section_title}>
                      BANK PAYOUT DESTINATION
                    </Text>

                    <View style={styles.receipt_row}>
                      <Text style={styles.receipt_label}>Bank Name</Text>
                      <Text style={styles.receipt_value}>
                        {selectedTxn.bank_details.bank_name}
                      </Text>
                    </View>
                    <View style={styles.receipt_row}>
                      <Text style={styles.receipt_label}>Account Number</Text>
                      <Text style={styles.receipt_value}>
                        {selectedTxn.bank_details.account_number}
                      </Text>
                    </View>
                    <View style={styles.receipt_row}>
                      <Text style={styles.receipt_label}>Account Name</Text>
                      <Text style={styles.receipt_value}>
                        {selectedTxn.bank_details.account_name}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default RestaurantTransactions;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  top_nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  nav_icon_btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  header_center: {
    alignItems: "center",
  },
  header_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  header_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
  },
  scroll_content: {
    paddingHorizontal: 16,
    gap: 16,
  },

  // Balance Card
  balance_card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  balance_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balance_label_row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  balance_label_text: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  live_status_pill: {
    backgroundColor: "#4caf501f",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4caf5044",
  },
  live_status_text: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 10,
  },
  balance_amount_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 32,
  },
  kobo_text: {
    fontSize: 20,
    color: "#9CA3AF",
  },
  stats_row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262626",
  },
  stat_item: {
    flex: 1,
    alignItems: "center",
  },
  stat_divider: {
    width: 1,
    height: 24,
    backgroundColor: "#2a2a2a",
  },
  stat_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stat_value_green: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  stat_value_red: {
    color: "#ef5350",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  withdraw_btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
  },
  withdraw_btn_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },

  // Filters & Search
  filter_section: {
    gap: 10,
  },
  search_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 8,
  },
  search_input: {
    flex: 1,
    color: "#fff",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  filter_chips_row: {
    flexDirection: "row",
    gap: 8,
  },
  filter_chip: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  filter_chip_active: {
    backgroundColor: "#ffffff20",
    borderColor: "#fff",
  },
  filter_chip_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 12,
  },
  filter_chip_text_active: {
    color: "#fff",
    fontFamily: "raleway-bold",
  },

  // Transactions List
  txn_list_container: {
    gap: 10,
  },
  section_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  empty_state: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 10,
  },
  empty_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  empty_sub: {
    color: "#777",
    fontFamily: "raleway-regular",
    fontSize: 13,
    textAlign: "center",
  },

  // Transaction Card
  txn_card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  txn_left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  icon_circle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  icon_circle_in: {
    backgroundColor: "#4caf501f",
    borderWidth: 1,
    borderColor: "#4caf5044",
  },
  icon_circle_out: {
    backgroundColor: "#ef53501f",
    borderWidth: 1,
    borderColor: "#ef535044",
  },
  txn_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  txn_sub: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
    marginTop: 2,
  },
  txn_date_text: {
    color: "#666",
    fontFamily: "raleway-regular",
    fontSize: 10,
    marginTop: 2,
  },
  txn_right: {
    alignItems: "flex-end",
    gap: 4,
    marginLeft: 10,
  },
  txn_amount_text: {
    fontFamily: "raleway-bold",
    fontSize: 15,
  },
  amount_green: {
    color: "#4caf50",
  },
  amount_red: {
    color: "#ef5350",
  },
  txn_status_badge: {
    backgroundColor: "#262626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  txn_status_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 9,
  },

  // Modal Backdrop
  modal_backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal_card: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 10,
  },
  modal_header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  modal_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 18,
  },
  bank_preview_box: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#262626",
    gap: 10,
  },
  bank_name_text: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  bank_acc_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-medium",
    fontSize: 11,
    marginTop: 2,
  },
  input_label: {
    color: "#777",
    fontFamily: "raleway-semibold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  text_input: {
    backgroundColor: "#121212",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quick_chip_row: {
    flexDirection: "row",
    gap: 8,
  },
  quick_chip: {
    flex: 1,
    backgroundColor: "#121212",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  quick_chip_text: {
    color: "#fff",
    fontFamily: "raleway-semibold",
    fontSize: 11,
  },
  modal_footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  modal_cancel_btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_cancel_text: {
    color: "#9CA3AF",
    fontFamily: "raleway-semibold",
    fontSize: 13,
  },
  modal_confirm_btn: {
    backgroundColor: "#fff",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modal_confirm_text: {
    color: "#121212",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },

  // Sheet Modal Details
  sheet_container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  sheet_header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  sheet_close_btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet_title: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 17,
  },
  sheet_scroll_content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  receipt_header: {
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 8,
  },
  receipt_icon_box: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  receipt_amount: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 28,
  },
  receipt_status_tag: {
    color: "#4caf50",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  receipt_box: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    gap: 12,
  },
  receipt_section_title: {
    color: "#777",
    fontFamily: "raleway-bold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  receipt_row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receipt_label: {
    color: "#9CA3AF",
    fontFamily: "raleway-regular",
    fontSize: 13,
  },
  receipt_value: {
    color: "#fff",
    fontFamily: "raleway-medium",
    fontSize: 13,
  },
  receipt_value_bold: {
    color: "#fff",
    fontFamily: "raleway-bold",
    fontSize: 13,
  },
  receipt_value_code: {
    color: "#ffc107",
    fontFamily: "raleway-bold",
    fontSize: 12,
  },
  receipt_divider: {
    height: 1,
    backgroundColor: "#262626",
    marginVertical: 4,
  },
});
