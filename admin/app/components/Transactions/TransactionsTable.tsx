"use client";

import { useState } from "react";
import Pagination from "../Pagination";
import TransactionActionsMenu from "./TransactionActionsMenu";
import TransactionDetailsModal from "./TransactionDetailsModal";
import { useTransactionContext } from "../../context/TransactionContext";

// UI Transaction interface (transformed from API)
interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  userProfilePic?: string;
  userType: "rider" | "driver";
  walletId: string;
  walletBalance: number;
  type: "funding" | "payment" | "payout";
  amount: number;
  status: "pending" | "success" | "failed";
  channel: "card" | "transfer" | "cash" | "wallet";
  rideId?: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

const TransactionsTable = ({
  transactions,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: TransactionsTableProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { fetchTransactionDetails } = useTransactionContext();

  const getStatusClass = (status: string) => {
    switch (status) {
      case "success":
        return "status-badge--active";
      case "pending":
        return "status-badge--warning";
      case "failed":
        return "status-badge--suspended";
      default:
        return "";
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "funding":
        return "transaction-type--funding";
      case "payment":
        return "transaction-type--payment";
      case "payout":
        return "transaction-type--payout";
      default:
        return "";
    }
  };

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "funding":
        return "Funding";
      case "payment":
        return "Payment";
      case "payout":
        return "Payout";
      default:
        return type;
    }
  };

  const getChannelDisplay = (channel: string) => {
    switch (channel) {
      case "card":
        return "Card";
      case "transfer":
        return "Transfer";
      case "cash":
        return "Cash";
      case "wallet":
        return "Wallet";
      default:
        return channel;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (transactionId: string) => {
    fetchTransactionDetails(transactionId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRetry = (transactionId: string) => {
    console.log("Retry transaction:", transactionId);
    // TODO: Implement retry logic
  };

  const handleRefund = (transactionId: string) => {
    console.log("Refund transaction:", transactionId);
    // TODO: Implement refund logic
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>User</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Channel</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <span className="transaction-id">{transaction.id}</span>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {transaction.userName.charAt(0)}
                    </div>
                    <div className="user-cell__info">
                      <span className="user-cell__name">
                        {transaction.userName}
                      </span>
                      <span className="user-cell__badge">
                        {transaction.userType === "rider" ? "Rider" : "Driver"}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className={`transaction-type ${getTypeClass(
                      transaction.type
                    )}`}
                  >
                    {getTypeDisplay(transaction.type)}
                  </span>
                </td>
                <td>
                  <span
                    className={`transaction-amount ${
                      transaction.type === "funding"
                        ? "transaction-amount--positive"
                        : "transaction-amount--negative"
                    }`}
                  >
                    {transaction.type === "funding" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </span>
                </td>
                <td>
                  <span className="transaction-channel">
                    {getChannelDisplay(transaction.channel)}
                  </span>
                </td>
                <td>
                  <span className="transaction-reference">
                    {transaction.reference || "N/A"}
                  </span>
                </td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(
                      transaction.status
                    )}`}
                  >
                    {transaction.status.charAt(0).toUpperCase() +
                      transaction.status.slice(1)}
                  </span>
                </td>
                <td>
                  <span className="transaction-date">
                    {formatDate(transaction.createdAt)}
                  </span>
                </td>
                <td>
                  <TransactionActionsMenu
                    transactionId={transaction.id}
                    transactionStatus={transaction.status}
                    transactionType={transaction.type}
                    onViewDetails={handleViewDetails}
                    onRetry={handleRetry}
                    onRefund={handleRefund}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

      <TransactionDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={null}
      />
    </>
  );
};

export default TransactionsTable;
