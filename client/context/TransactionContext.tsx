import React, {
  createContext,
  FC,
  ReactNode,
  useContext,
  useState,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";

export type Transaction = {
  _id: string;
  type: "funding" | "payment" | "payout" | "driver_payment" | "restaurant_payment";
  amount: number;
  status: "pending" | "success" | "failed";
  channel: "card" | "transfer" | "cash" | "wallet";
  reference?: string;
  createdAt: string;
  ride_id?: any;
  food_order_id?: any;
  metadata?: any;
};

export type EarningsStats = {
  totalTrips: number;
  todayEarnings: number;
  weekEarnings: number;
};

type TransactionContextType = {
  transactions: Transaction[];
  loading: boolean;
  hasMore: boolean;
  stats: EarningsStats;
  fetchTransactions: (type?: string, status?: string) => Promise<void>;
  loadMoreTransactions: () => Promise<void>;
  initiateWithdrawal: (amount: number) => Promise<any>;
  fetchEarningsStats: () => Promise<void>;

  // ─── Vendor / Restaurant Upgrade ───
  vendorTransactions: Transaction[];
  vendorStats: {
    totalOrders: number;
    todayEarnings: number;
    weekEarnings: number;
    withdrawableBalance: number;
    pendingBalance: number;
  };
  fetchVendorTransactions: (type?: string, status?: string) => Promise<void>;
  initiateVendorWithdrawal: (amount: number) => Promise<any>;
  fetchVendorEarningsStats: () => Promise<void>;
};

const TransactionContext = createContext<TransactionContextType | null>(null);

const TransactionContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotificationContext()!;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [vendorTransactions, setVendorTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [currentFilters, setCurrentFilters] = useState({
    type: "",
    status: "",
  });
  const [stats, setStats] = useState<EarningsStats>({
    totalTrips: 0,
    todayEarnings: 0,
    weekEarnings: 0,
  });
  const [vendorStats, setVendorStats] = useState({
    totalOrders: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    withdrawableBalance: 0,
    pendingBalance: 0,
  });

  const getAuthToken = async () => {
    return (
      (await AsyncStorage.getItem("token")) ||
      (await AsyncStorage.getItem("userToken"))
    );
  };

  // Driver / General User Transactions
  const fetchTransactions = async (type?: string, status?: string) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      let url = `${API_URLS.transactions}/driver?limit=20&skip=0`;

      if (type) url += `&type=${type}`;
      if (status) url += `&status=${status}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(data.transactions || []);
      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentPage(0);
      setCurrentFilters({ type: type || "", status: status || "" });
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Error fetching transactions";
      console.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;
      const token = await getAuthToken();

      let url = `${API_URLS.transactions}/driver?limit=20&skip=${
        nextPage * 20
      }`;
      if (currentFilters.type) url += `&type=${currentFilters.type}`;
      if (currentFilters.status) url += `&status=${currentFilters.status}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions((prev) => [...prev, ...(data.transactions || [])]);
      setHasMore(data.pagination?.hasMore ?? false);
      setCurrentPage(nextPage);
    } catch (error: any) {
      const errMsg =
        error.response?.data?.msg || "Error loading more transactions";
      console.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const initiateWithdrawal = async (amount: number) => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const { data } = await axios.post(
        `${API_URLS.transactions}/driver/withdraw`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTransactions((prev) => [data.transaction, ...prev]);
      showNotification("Withdrawal initiated successfully", "success");
      return data.transaction;
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Withdrawal failed";
      showNotification(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsStats = async () => {
    try {
      const token = await getAuthToken();
      const { data } = await axios.get(
        `${API_URLS.transactions}/driver/earnings-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data?.stats) {
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error("fetchEarningsStats error:", error?.response?.data || error.message);
    }
  };

  // ─── Vendor / Restaurant Transaction Extensions ───

  // ─── Vendor / Restaurant Transaction Extensions ───

  const fetchVendorTransactions = async (type?: string, status?: string) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      let url = `${API_URLS.transactions}/vendor?limit=50&skip=0`;
      if (type) url += `&type=${type}`;
      if (status) url += `&status=${status}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.transactions) {
        setVendorTransactions(data.transactions);
      }
      setVendorStats((prev) => ({
        ...prev,
        withdrawableBalance:
          typeof data?.wallet_balance === "number"
            ? data.wallet_balance
            : prev.withdrawableBalance,
        todayEarnings:
          typeof data?.wallet_balance === "number"
            ? data.wallet_balance
            : prev.todayEarnings,
        pendingBalance:
          typeof data?.pending_balance === "number"
            ? data.pending_balance
            : prev.pendingBalance,
      }));
    } catch (error: any) {
      console.error("fetchVendorTransactions error:", error?.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const initiateVendorWithdrawal = async (amount: number) => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const { data } = await axios.post(
        `${API_URLS.wallet}/vendor/withdraw`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showNotification("Vendor withdrawal request submitted successfully", "success");
      fetchVendorTransactions();
      return data;
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Vendor withdrawal failed";
      showNotification(errMsg, "error");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorEarningsStats = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // 1. Fetch restaurant wallet balance from dedicated restaurant wallet endpoint
      const { data: wData } = await axios.get(
        `${API_URLS.wallet}/balance?owner_type=Restaurant`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Fetch vendor orders to calculate accepted sales
      const { data: orderData } = await axios.get(
        `${API_URLS.orders}/vendor`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let walletBalance = wData?.wallet?.balance || 0;
      let pendingBalance = wData?.wallet?.pending_balance || 0;

      if (orderData?.orders && Array.isArray(orderData.orders)) {
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        ).getTime();

        const startOfWeekDate = new Date(now);
        startOfWeekDate.setDate(now.getDate() - now.getDay());
        startOfWeekDate.setHours(0, 0, 0, 0);
        const startOfWeek = startOfWeekDate.getTime();

        let todaySum = 0;
        let weekSum = 0;
        let acceptedCount = 0;

        const acceptedStatuses = [
          "preparing",
          "ready_for_pickup",
          "in_transit",
          "delivered",
        ];

        orderData.orders.forEach((o: any) => {
          if (acceptedStatuses.includes(o.status)) {
            acceptedCount++;
            const time = new Date(o.createdAt).getTime();
            const earnings =
              o.pricing?.restaurant_earnings || o.pricing?.subtotal || 0;
            if (time >= startOfToday) todaySum += earnings;
            if (time >= startOfWeek) weekSum += earnings;
          }
        });

        setVendorStats({
          totalOrders: acceptedCount,
          todayEarnings: walletBalance > 0 ? walletBalance : todaySum,
          weekEarnings: weekSum,
          withdrawableBalance: walletBalance,
          pendingBalance: pendingBalance,
        });
      }
    } catch (error: any) {
      console.error("fetchVendorEarningsStats error:", error);
    }
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        hasMore,
        stats,
        fetchTransactions,
        loadMoreTransactions,
        initiateWithdrawal,
        fetchEarningsStats,

        // Vendor
        vendorTransactions,
        vendorStats,
        fetchVendorTransactions,
        initiateVendorWithdrawal,
        fetchVendorEarningsStats,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error(
      "Transaction context can only be used within TransactionContextProvider"
    );
  }
  return context;
};

export default TransactionContextProvider;
