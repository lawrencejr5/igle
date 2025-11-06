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
} from "react-icons/md";
import { Ride } from "../data/rides";

interface RideDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ride: Ride | null;
}

const RideDetailsModal = ({ isOpen, onClose, ride }: RideDetailsModalProps) => {
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

  if (!ride) return null;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "status-badge--active";
      case "ongoing":
      case "accepted":
      case "arrived":
        return "status-badge--warning";
      case "pending":
      case "scheduled":
        return "status-badge--info";
      case "cancelled":
      case "expired":
        return "status-badge--suspended";
      default:
        return "";
    }
  };

  const getVehicleDisplay = (vehicle: string) => {
    switch (vehicle) {
      case "cab":
        return "Cab";
      case "keke":
        return "Keke";
      case "suv":
        return "SUV";
      default:
        return vehicle;
    }
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
          <h2 className="user-details-modal__title">Ride Details</h2>
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
          {/* Ride ID and Status Section */}
          <div className="user-details-modal__profile">
            <div className="user-details-modal__avatar">
              {ride.id.charAt(0)}
            </div>
            <div className="user-details-modal__profile-info">
              <h3 className="user-details-modal__name">{ride.id}</h3>
              <span className={`status-badge ${getStatusClass(ride.status)}`}>
                {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Rider and Driver Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Rider & Driver Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPerson />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Rider</span>
                  <span className="user-details-modal__info-value">
                    {ride.riderName}
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
                    {ride.driverName || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>
          </div>

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
                    {ride.pickup.address}
                  </span>
                  <span className="user-details-modal__info-subtext">
                    {ride.pickup.coordinates[0]}, {ride.pickup.coordinates[1]}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdFlag />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Destination
                  </span>
                  <span className="user-details-modal__info-value">
                    {ride.destination.address}
                  </span>
                  <span className="user-details-modal__info-subtext">
                    {ride.destination.coordinates[0]},{" "}
                    {ride.destination.coordinates[1]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Ride Details */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Ride Information
            </h4>
            <div className="user-details-modal__stats-grid">
              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides">
                  <MdDirectionsCar />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {getVehicleDisplay(ride.vehicle)}
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
                    {ride.distance_km} km
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
                    {ride.duration_mins} mins
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
                    {formatCurrency(ride.fare)}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Total Fare
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
                    {ride.payment_status.charAt(0).toUpperCase() +
                      ride.payment_status.slice(1)}
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
                    {ride.payment_method.charAt(0).toUpperCase() +
                      ride.payment_method.slice(1)}
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
                    {formatCurrency(ride.driver_earnings)}
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
                    {formatCurrency(ride.commission)}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPayment />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Driver Paid
                  </span>
                  <span className="user-details-modal__info-value">
                    {ride.driver_paid ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scheduled Information */}
          {ride.scheduled && (
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
                      {formatDate(ride.scheduled_time || undefined)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Information */}
          {ride.cancelled && (
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
                      {ride.cancelled.by?.charAt(0).toUpperCase() +
                        (ride.cancelled.by?.slice(1) || "")}
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
                      {ride.cancelled.reason || "N/A"}
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
                    {formatDate(ride.createdAt)}
                  </span>
                </div>
              </div>

              {ride.timestamps.accepted_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Accepted At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(ride.timestamps.accepted_at)}
                    </span>
                  </div>
                </div>
              )}

              {ride.timestamps.arrived_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Arrived At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(ride.timestamps.arrived_at)}
                    </span>
                  </div>
                </div>
              )}

              {ride.timestamps.started_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Started At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(ride.timestamps.started_at)}
                    </span>
                  </div>
                </div>
              )}

              {ride.timestamps.completed_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Completed At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(ride.timestamps.completed_at)}
                    </span>
                  </div>
                </div>
              )}

              {ride.timestamps.cancelled_at && (
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Cancelled At
                    </span>
                    <span className="user-details-modal__info-value">
                      {formatDate(ride.timestamps.cancelled_at)}
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

export default RideDetailsModal;
