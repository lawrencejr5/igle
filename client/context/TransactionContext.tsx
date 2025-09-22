import React, {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URLS } from "../data/constants";
import { useNotificationContext } from "./NotificationContext";

type Transaction = {
  _id: string;
  type: "funding" | "payment" | "payout";
  amount: number;
  status: "pending" | "success" | "failed";
  channel: "card" | "transfer" | "cash" | "wallet";
  reference?: string;
  createdAt: string;
  ride_id?: any;
  metadata?: any;
};

type EarningsStats = {
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
  initiateWithdrawal: (amount: number) => Promise<void>;
  fetchEarningsStats: () => Promise<void>;
};

const TransactionContext = createContext<TransactionContextType | null>(null);

const TransactionContextProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showNotification } = useNotificationContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const fetchTransactions = async (type?: string, status?: string) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      let url = `${API_URLS.transactions}/driver?limit=20&skip=0`;

      if (type) url += `&type=${type}`;
      if (status) url += `&status=${status}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions(data.transactions);
      setHasMore(data.pagination.hasMore);
      setCurrentPage(0);
      setCurrentFilters({ type: type || "", status: status || "" });
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Error fetching transactions";
      showNotification(errMsg, "error");
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
      const token = await AsyncStorage.getItem("token");

      let url = `${API_URLS.transactions}/driver?limit=20&skip=${
        nextPage * 20
      }`;
      if (currentFilters.type) url += `&type=${currentFilters.type}`;
      if (currentFilters.status) url += `&status=${currentFilters.status}`;

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTransactions((prev) => [...prev, ...data.transactions]);
      setHasMore(data.pagination.hasMore);
      setCurrentPage(nextPage);
    } catch (error: any) {
      const errMsg =
        error.response?.data?.msg || "Error loading more transactions";
      showNotification(errMsg, "error");
      console.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const initiateWithdrawal = async (amount: number) => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      const { data } = await axios.post(
        `${API_URLS.transactions}/driver/withdraw`,
        { amount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add the new transaction to the list
      setTransactions((prev) => [data.transaction, ...prev]);
      showNotification("Withdrawal initiated successfully", "success");

      return data.transaction;
    } catch (error: any) {
      const errMsg = error.response?.data?.msg || "Withdrawal failed";
      showNotification(errMsg, "error");
      console.error(errMsg);
      throw new Error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchEarningsStats = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const { data } = await axios.get(
        `${API_URLS.transactions}/driver/earnings-stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(data.stats);
    } catch (error: any) {
      const errMsg =
        error.response?.data?.msg || "Error fetching earnings stats";
      showNotification(errMsg, "error");
      console.error(errMsg);
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
