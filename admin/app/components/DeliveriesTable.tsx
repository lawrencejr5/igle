"use client";

import { useState } from "react";
import { Delivery } from "../data/deliveries";
import Pagination from "./Pagination";
import DeliveryActionsMenu from "./DeliveryActionsMenu";
import DeliveryDetailsModal from "./DeliveryDetailsModal";

interface DeliveriesTableProps {
  deliveries: Delivery[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DeliveriesTable = ({
  deliveries,
  currentPage,
  totalPages,
  onPageChange,
}: DeliveriesTableProps) => {
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleViewDetails = (deliveryId: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (delivery) {
      setSelectedDelivery(delivery);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedDelivery(null);
    }, 300); // Wait for animation to complete
  };

  const handleCancel = (deliveryId: string) => {
    console.log("Cancel delivery:", deliveryId);
    // TODO: Implement cancel logic
  };

  const handleAssignDriver = (deliveryId: string) => {
    console.log("Assign driver to delivery:", deliveryId);
    // TODO: Implement assign driver logic
  };

  const handleRefund = (deliveryId: string) => {
    console.log("Refund delivery:", deliveryId);
    // TODO: Implement refund logic
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Delivery ID</th>
              <th>Sender</th>
              <th>Driver</th>
              <th>Recipient</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Package</th>
              <th>Vehicle</th>
              <th>Fare</th>
              <th>Distance</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td>
                  <span className="ride-id">{delivery.id}</span>
                </td>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {delivery.senderName.charAt(0)}
                    </div>
                    <span className="user-cell__name">
                      {delivery.senderName}
                    </span>
                  </div>
                </td>
                <td>
                  {delivery.driverName ? (
                    <div className="user-cell">
                      <div className="user-cell__avatar">
                        {delivery.driverName.charAt(0)}
                      </div>
                      <span className="user-cell__name">
                        {delivery.driverName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">Unassigned</span>
                  )}
                </td>
                <td>
                  {delivery.to?.name ? (
                    <div className="recipient-cell">
                      <span className="recipient-cell__name">
                        {delivery.to.name}
                      </span>
                      {delivery.to.phone && (
                        <span className="recipient-cell__phone">
                          {delivery.to.phone}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
                <td>
                  <div className="location-cell">
                    <span className="location-cell__text">
                      {delivery.pickup.address}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="location-cell">
                    <span className="location-cell__text">
                      {delivery.dropoff.address}
                    </span>
                  </div>
                </td>
                <td>
                  <div className="package-cell">
                    <span className="package-cell__type">
                      {getPackageTypeDisplay(delivery.package.type)}
                    </span>
                    {delivery.package.fragile && (
                      <span className="package-cell__fragile">Fragile</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="vehicle-badge">
                    {getVehicleDisplay(delivery.vehicle)}
                  </span>
                </td>
                <td>
                  <span className="fare-amount">
                    {formatCurrency(delivery.fare)}
                  </span>
                </td>
                <td>{delivery.distance_km} km</td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(
                      delivery.status
                    )}`}
                  >
                    {delivery.status.charAt(0).toUpperCase() +
                      delivery.status.slice(1).replace("_", " ")}
                  </span>
                </td>
                <td>
                  <div className="payment-cell">
                    <span
                      className={`payment-status ${
                        delivery.payment_status === "paid"
                          ? "payment-status--paid"
                          : "payment-status--unpaid"
                      }`}
                    >
                      {delivery.payment_status.charAt(0).toUpperCase() +
                        delivery.payment_status.slice(1)}
                    </span>
                    <span className="payment-method">
                      {delivery.payment_method.charAt(0).toUpperCase() +
                        delivery.payment_method.slice(1)}
                    </span>
                  </div>
                </td>
                <td>
                  <DeliveryActionsMenu
                    deliveryId={delivery.id}
                    deliveryStatus={delivery.status}
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

      <DeliveryDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        delivery={selectedDelivery}
      />
    </>
  );
};

export default DeliveriesTable;
