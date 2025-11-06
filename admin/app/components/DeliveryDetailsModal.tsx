"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import {
  MdPerson,
  MdDirectionsCar,
  MdLocationOn,
  MdFlag,
  MdPayment,
  MdTimer,
  MdRoute,
  MdAttachMoney,
  MdSchedule,
  MdCancel,
  MdLocalShipping,
  MdPhone,
  MdInventory,
  MdWarning,
} from "react-icons/md";
import { Delivery } from "../data/deliveries";

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: Delivery | null;
}

const DeliveryDetailsModal = ({
  isOpen,
  onClose,
  delivery,
}: DeliveryDetailsModalProps) => {
  useEffect(() => {
    // Prevent body scroll when modal is open
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
    // Handle ESC key press
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

  if (!delivery) return null;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "delivered":
        return "status-badge--active";
      case "in_transit":
      case "picked_up":
      case "accepted":
      case "arrived":
        return "status-badge--warning";
      case "pending":
      case "scheduled":
        return "status-badge--info";
      case "cancelled":
      case "expired":
      case "failed":
        return "status-badge--suspended";
      default:
        return "";
    }
  };

  const getVehicleDisplay = (vehicle: string) => {
    switch (vehicle) {
      case "bike":
        return "Bike";
      case "cab":
        return "Cab";
      case "van":
        return "Van";
      case "truck":
        return "Truck";
      default:
        return vehicle;
    }
  };

  const getPackageTypeDisplay = (type?: string) => {
    if (!type) return "Other";
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
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
          <h2 className="user-details-modal__title">Delivery Details</h2>
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
          {/* Delivery ID and Status Section */}
          <div className="user-details-modal__profile">
            <div className="user-details-modal__avatar">
              {delivery.id.charAt(0)}
            </div>
            <div className="user-details-modal__profile-info">
              <h3 className="user-details-modal__name">{delivery.id}</h3>
              <span
                className={`status-badge ${getStatusClass(delivery.status)}`}
              >
                {delivery.status.charAt(0).toUpperCase() +
                  delivery.status.slice(1).replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Sender and Driver Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Sender & Driver Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPerson />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Sender</span>
                  <span className="user-details-modal__info-value">
                    {delivery.senderName}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdDirectionsCar />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Driver</span>
                  <span className="user-details-modal__info-value">
                    {delivery.driverName || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recipient Information */}
          {delivery.to && (
            <div className="user-details-modal__section">
              <h4 className="user-details-modal__section-title">
                Recipient Information
              </h4>
              <div className="user-details-modal__info-grid">
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdPerson />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">Name</span>
                    <span className="user-details-modal__info-value">
                      {delivery.to.name || "N/A"}
                    </span>
                  </div>
                </div>

                {delivery.to.phone && (
                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-icon">
                      <MdPhone />
                    </div>
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Phone
                      </span>
                      <span className="user-details-modal__info-value">
                        {delivery.to.phone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Location Details
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdLocationOn />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Pickup</span>
                  <span className="user-details-modal__info-value">
                    {delivery.pickup.address}
                  </span>
                  <span className="user-details-modal__info-subtext">
                    {delivery.pickup.coordinates[0]},{" "}
                    {delivery.pickup.coordinates[1]}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdFlag />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Dropoff
                  </span>
                  <span className="user-details-modal__info-value">
                    {delivery.dropoff.address}
                  </span>
                  <span className="user-details-modal__info-subtext">
                    {delivery.dropoff.coordinates[0]},{" "}
                    {delivery.dropoff.coordinates[1]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Package Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Package Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdInventory />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Type</span>
                  <span className="user-details-modal__info-value">
                    {getPackageTypeDisplay(delivery.package.type)}
                  </span>
                </div>
              </div>

              {delivery.package.description && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdInventory />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Description
                    </span>
                    <span className="user-details-modal__info-value">
                      {delivery.package.description}
                    </span>
                  </div>
                </div>
              )}

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdWarning />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Fragile
                  </span>
                  <span className="user-details-modal__info-value">
                    {delivery.package.fragile ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {delivery.package.amount && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdAttachMoney />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Package Value
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatCurrency(delivery.package.amount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Delivery Information
            </h4>
            <div className="user-details-modal__stats-grid">
              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides">
                  <MdLocalShipping />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {getVehicleDisplay(delivery.vehicle)}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Vehicle Type
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--deliveries">
                  <MdRoute />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {delivery.distance_km} km
                  </span>
                  <span className="user-details-modal__stat-label">
                    Distance
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides">
                  <MdTimer />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {delivery.duration_mins} mins
                  </span>
                  <span className="user-details-modal__stat-label">
                    Duration
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--deliveries">
                  <MdAttachMoney />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {formatCurrency(delivery.fare)}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Delivery Fare
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Payment Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPayment />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Payment Status
                  </span>
                  <span className="user-details-modal__info-value">
                    {delivery.payment_status.charAt(0).toUpperCase() +
                      delivery.payment_status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPayment />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Payment Method
                  </span>
                  <span className="user-details-modal__info-value">
                    {delivery.payment_method.charAt(0).toUpperCase() +
                      delivery.payment_method.slice(1)}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdAttachMoney />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Driver Earnings
                  </span>
                  <span className="user-details-modal__info-value">
                    {formatCurrency(delivery.driver_earnings)}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdAttachMoney />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Commission
                  </span>
                  <span className="user-details-modal__info-value">
                    {formatCurrency(delivery.commission)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Information */}
          {delivery.scheduled && (
            <div className="user-details-modal__section">
              <h4 className="user-details-modal__section-title">
                Schedule Information
              </h4>
              <div className="user-details-modal__info-grid">
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdSchedule />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Scheduled For
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(delivery.scheduled_time || undefined)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Information */}
          {delivery.cancelled && (
            <div className="user-details-modal__section">
              <h4 className="user-details-modal__section-title">
                Cancellation Details
              </h4>
              <div className="user-details-modal__info-grid">
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdCancel />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Cancelled By
                    </span>
                    <span className="user-details-modal__info-value">
                      {delivery.cancelled.by?.charAt(0).toUpperCase() +
                        (delivery.cancelled.by?.slice(1) || "")}
                    </span>
                  </div>
                </div>

                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdCancel />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Reason
                    </span>
                    <span className="user-details-modal__info-value">
                      {delivery.cancelled.reason || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">Timeline</h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Created At
                  </span>
                  <span className="user-details-modal__info-value">
                    {formatDate(delivery.createdAt)}
                  </span>
                </div>
              </div>

              {delivery.timestamps.accepted_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Accepted At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(delivery.timestamps.accepted_at)}
                    </span>
                  </div>
                </div>
              )}

              {delivery.timestamps.picked_up_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Picked Up At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(delivery.timestamps.picked_up_at)}
                    </span>
                  </div>
                </div>
              )}

              {delivery.timestamps.delivered_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Delivered At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(delivery.timestamps.delivered_at)}
                    </span>
                  </div>
                </div>
              )}

              {delivery.timestamps.cancelled_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Cancelled At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(delivery.timestamps.cancelled_at)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
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

export default DeliveryDetailsModal;
