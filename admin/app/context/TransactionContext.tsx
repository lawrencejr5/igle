"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAlert } from "./AlertContext";

// Transaction interface matching backend model
export interface Transaction {
  _id: string;
  wallet_id: {
    _id: string;
    owner_id: {
      _id: string;
      name?: string;
      email?: string;
      phone?: string;
      profile_pic?: string;
    };
    owner_type: "User" | "Driver";
    balance: number;
  };
  type: "funding" | "payment" | "payout";
  amount: number;
  status: "pending" | "success" | "failed";
  channel: "card" | "transfer" | "cash" | "wallet";
  ride_id?: {
    _id: string;
    pickup: {
      address: string;
    };
    dropoff: {
      address: string;
    };
    fare: number;
  };
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Detailed transaction interface with populated fields
export interface TransactionDetails extends Transaction {}

// API response interface for transactions list
interface TransactionsListResponse {
  msg: string;
  transactions: Transaction[];
  total: number;
  page: number;
  pages: number;
}

// Context interface
interface TransactionContextType {
  transactions: Transaction[];
  currentTransaction: TransactionDetails | null;
  totalTransactions: number;
  currentPage: number;
  totalPages: number;
  loading: boolean;
  fetchTransactions: (
    page?: number,
    limit?: number,
    filters?: {
      type?: string;
      status?: string;
      wallet_id?: string;
      owner_id?: string;
    }
  ) => Promise<void>;
  fetchTransactionDetails: (transactionId: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(
  undefined
);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] =
    useState<TransactionDetails | null>(null);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const { showAlert } = useAlert();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

  const API_URL = `${API_BASE_URL}/transactions`;

  // Get admin token from localStorage
  const getAuthHeaders = () => {
    const admin_token = localStorage.getItem("admin_token");
    return {
      headers: {
        Authorization: `Bearer ${admin_token}`,
      },
    };
  };

  // Fetch paginated transactions list with optional filters
  const fetchTransactions = async (
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: string;
      status?: string;
      wallet_id?: string;
      owner_id?: string;
    }
  ) => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filters?.type) params.type = filters.type;
      if (filters?.status) params.status = filters.status;
      if (filters?.wallet_id) params.wallet_id = filters.wallet_id;
      if (filters?.owner_id) params.owner_id = filters.owner_id;

      const response = await axios.get<TransactionsListResponse>(
        `${API_URL}/admin/transactions`,
        {
          ...getAuthHeaders(),
          params,
        }
      );

      setTransactions(response.data.transactions);
      setTotalTransactions(response.data.total);
      setCurrentPage(response.data.page);
      setTotalPages(response.data.pages);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch transactions",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch single transaction details with full population
  const fetchTransactionDetails = async (transactionId: string) => {
    setLoading(true);
    try {
      const response = await axios.get<{
        msg: string;
        transaction: TransactionDetails;
      }>(`${API_URL}/admin/transactions/data`, {
        ...getAuthHeaders(),
        params: { id: transactionId },
      });

      setCurrentTransaction(response.data.transaction);
    } catch (error: any) {
      console.error("Error fetching transaction details:", error);
      showAlert(
        error.response?.data?.msg || "Failed to fetch transaction details",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const value: TransactionContextType = {
    transactions,
    currentTransaction,
    totalTransactions,
    currentPage,
    totalPages,
    loading,
    fetchTransactions,
    fetchTransactionDetails,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactionContext = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error(
      "useTransactionContext must be used within a TransactionProvider"
    );
  }
  return context;
};
