"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import {
  MdPerson,
  MdAccountBalanceWallet,
  MdPayment,
  MdAttachMoney,
  MdReceipt,
  MdInfo,
  MdAccessTime,
  MdCheckCircle,
  MdError,
  MdPending,
} from "react-icons/md";
import { useTransactionContext } from "../context/TransactionContext";

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
  rideDetails?: {
    pickup: string;
    dropoff: string;
    fare: number;
  };
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailsModal = ({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsModalProps) => {
  const { currentTransaction } = useTransactionContext();

  // Transform API transaction to UI format if using context transaction
  const displayTransaction = currentTransaction
    ? {
        id: currentTransaction._id,
        userId: currentTransaction.wallet_id.owner_id._id,
        userName: currentTransaction.wallet_id.owner_id.name || "Unknown User",
        userEmail: currentTransaction.wallet_id.owner_id.email,
        userPhone: currentTransaction.wallet_id.owner_id.phone,
        userProfilePic: currentTransaction.wallet_id.owner_id.profile_pic,
        userType: (currentTransaction.wallet_id.owner_type.toLowerCase() ===
        "user"
          ? "rider"
          : "driver") as "rider" | "driver",
        walletId: currentTransaction.wallet_id._id,
        walletBalance: currentTransaction.wallet_id.balance,
        type: currentTransaction.type,
        amount: currentTransaction.amount,
        status: currentTransaction.status,
        channel: currentTransaction.channel,
        rideId: currentTransaction.ride_id?._id,
        rideDetails: currentTransaction.ride_id
          ? {
              pickup: currentTransaction.ride_id.pickup.address,
              dropoff: currentTransaction.ride_id.dropoff.address,
              fare: currentTransaction.ride_id.fare,
            }
          : undefined,
        reference: currentTransaction.reference,
        metadata: currentTransaction.metadata,
        createdAt: new Date(currentTransaction.createdAt),
        updatedAt: new Date(currentTransaction.updatedAt),
      }
    : transaction;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!displayTransaction) return null;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <MdCheckCircle />;
      case "pending":
        return <MdPending />;
      case "failed":
        return <MdError />;
      default:
        return <MdInfo />;
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
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`user-details-modal__backdrop ${
          isOpen ? "user-details-modal__backdrop--open" : ""
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`user-details-modal ${
          isOpen ? "user-details-modal--open" : ""
        }`}
      >
        {/* Header */}
        <div className="user-details-modal__header">
          <h2 className="user-details-modal__title">Transaction Details</h2>
          <button
            className="user-details-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <IoClose />
          </button>
        </div>

        {/* Content */}
        <div className="user-details-modal__content">
          {/* Transaction ID and Status */}
          <div className="user-details-modal__profile">
            <div className="user-details-modal__avatar">
              {getStatusIcon(displayTransaction.status)}
            </div>
            <div className="user-details-modal__profile-info">
              <h3 className="user-details-modal__name">
                {displayTransaction.id}
              </h3>
              <span
                className={`status-badge ${getStatusClass(
                  displayTransaction.status
                )}`}
              >
                {displayTransaction.status.charAt(0).toUpperCase() +
                  displayTransaction.status.slice(1)}
              </span>
            </div>
          </div>

          {/* User Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              User Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPerson />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    User Name
                  </span>
                  <span className="user-details-modal__info-value">
                    {displayTransaction.userName}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPerson />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    User Type
                  </span>
                  <span className="user-details-modal__info-value">
                    {displayTransaction.userType.charAt(0).toUpperCase() +
                      displayTransaction.userType.slice(1)}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdAccountBalanceWallet />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Wallet ID
                  </span>
                  <span className="user-details-modal__info-value">
                    {displayTransaction.walletId}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPerson />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    User ID
                  </span>
                  <span className="user-details-modal__info-value">
                    {displayTransaction.userId}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Transaction Information
            </h4>
            <div className="user-details-modal__stats-grid">
              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides">
                  <MdReceipt />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {getTypeDisplay(displayTransaction.type)}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Transaction Type
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--deliveries">
                  <MdAttachMoney />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {formatCurrency(displayTransaction.amount)}
                  </span>
                  <span className="user-details-modal__stat-label">Amount</span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides">
                  <MdPayment />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {getChannelDisplay(displayTransaction.channel)}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Payment Channel
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--deliveries">
                  <MdAccessTime />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {formatDate(displayTransaction.createdAt)}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Created At
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Reference Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdReceipt />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Reference
                  </span>
                  <span className="user-details-modal__info-value">
                    {displayTransaction.reference || "N/A"}
                  </span>
                </div>
              </div>

              {displayTransaction.rideId && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdInfo />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Ride/Delivery ID
                    </span>
                    <span className="user-details-modal__info-value">
                      {displayTransaction.rideId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Information */}
          {displayTransaction.metadata &&
            Object.keys(displayTransaction.metadata).length > 0 && (
              <div className="user-details-modal__section">
                <h4 className="user-details-modal__section-title">
                  Additional Information
                </h4>
                <div className="user-details-modal__info-grid">
                  {Object.entries(displayTransaction.metadata).map(
                    ([key, value]) => (
                      <div key={key} className="user-details-modal__info-item">
                        <div className="user-details-modal__info-icon">
                          <MdInfo />
                        </div>
                        <div className="user-details-modal__info-content">
                          <span className="user-details-modal__info-label">
                            {key
                              .split(/(?=[A-Z])/)
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </span>
                          <span className="user-details-modal__info-value">
                            {typeof value === "object"
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="user-details-modal__footer">
          <button
            className="user-details-modal__button user-details-modal__button--secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default TransactionDetailsModal;
