"use client";

import { useState } from "react";
import { Ride } from "../../data/rides";
import Pagination from "../Pagination";
import RideActionsMenu from "./RideActionsMenu";
import RideDetailsModal from "./RideDetailsModal";
import ConfirmModal from "../ConfirmModal";
import { useRideContext } from "../../context/RideContext";

interface RidesTableProps {
  rides: Ride[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

const RidesTable = ({
  rides,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: RidesTableProps) => {
  const { fetchRideDetails, cancelRide } = useRideContext();
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "cancel" | "refund" | null;
    rideId: string | null;
  }>({ type: null, rideId: null });

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

  const handleViewDetails = (rideId: string) => {
    const ride = rides.find((r) => r.id === rideId);
    if (ride) {
      setSelectedRide(ride);
      setIsModalOpen(true);
      // Fetch full details from API
      fetchRideDetails(rideId);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedRide(null);
    }, 300);
  };

  const handleCancel = (rideId: string) => {
    setConfirmAction({ type: "cancel", rideId });
  };

  const handleConfirmCancel = async () => {
    if (confirmAction.rideId) {
      try {
        await cancelRide(confirmAction.rideId, "Cancelled by admin");
        setConfirmAction({ type: null, rideId: null });
        if (onRefresh) onRefresh();
      } catch (error) {
        // Error is already handled in context
      }
    }
  };

  const handleCancelConfirm = () => {
    setConfirmAction({ type: null, rideId: null });
  };

  const handleAssignDriver = (rideId: string) => {
    console.log("Assign driver to ride:", rideId);
    // TODO: Implement assign driver logic
  };

  const handleRefund = (rideId: string) => {
    console.log("Refund ride:", rideId);
    // TODO: Implement refund logic
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ride ID</th>
              <th>Rider</th>
              <th>Driver</th>
              <th>Pickup</th>
              <th>Destination</th>
              <th>Vehicle</th>
              <th>Fare</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rides.map((ride) => (
              <tr key={ride.id}>
                <td>
                  <span className="ride-id">{ride.id}</span>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {ride.riderName.charAt(0)}
                    </div>
                    <span className="user-cell__name">{ride.riderName}</span>
                  </div>
                </td>
                <td>
                  {ride.driverName ? (
                    <div className="user-cell">
                      <div className="user-cell__avatar">
                        {ride.driverName.charAt(0)}
                      </div>
                      <span className="user-cell__name">{ride.driverName}</span>
                    </div>
                  ) : (
                    <span className="text-muted">Unassigned</span>
                  )}
                </td>
                <td>
                  <div className="location-cell">
                    <span className="location-cell__text">
                      {ride.pickup.address}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="location-cell">
                    <span className="location-cell__text">
                      {ride.destination.address}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="vehicle-badge">
                    {getVehicleDisplay(ride.vehicle)}
                  </span>
                </td>
                <td>
                  <span className="fare-amount">
                    {formatCurrency(ride.fare)}
                  </span>
                </td>
                <td>{ride.distance_km} km</td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(ride.status)}`}
                  >
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </span>
                </td>
                <td>
                  <div className="payment-cell">
                    <span
                      className={`payment-status ${
                        ride.payment_status === "paid"
                          ? "payment-status--paid"
                          : "payment-status--unpaid"
                      }`}
                    >
                      {ride.payment_status.charAt(0).toUpperCase() +
                        ride.payment_status.slice(1)}
                    </span>
                    <span className="payment-method">
                      {ride.payment_method.charAt(0).toUpperCase() +
                        ride.payment_method.slice(1)}
                    </span>
                  </div>
                </td>
                <td>
                  <RideActionsMenu
                    rideId={ride.id}
                    rideStatus={ride.status}
                    onViewDetails={handleViewDetails}
                    onCancel={handleCancel}
                    onAssignDriver={handleAssignDriver}
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

      <RideDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        ride={selectedRide}
      />

      <ConfirmModal
        isOpen={!!confirmAction.type}
        title={confirmAction.type === "cancel" ? "Cancel Ride" : "Refund Ride"}
        message={
          confirmAction.type === "cancel"
            ? "Are you sure you want to cancel this ride? This action cannot be undone."
            : "Are you sure you want to refund this ride?"
        }
        confirmText={confirmAction.type === "cancel" ? "Cancel Ride" : "Refund"}
        cancelText="Go Back"
        onConfirm={handleConfirmCancel}
        onCancel={handleCancelConfirm}
        variant="danger"
      />
    </>
  );
};

export default RidesTable;
