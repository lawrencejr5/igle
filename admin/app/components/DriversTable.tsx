"use client";

import { useState } from "react";
import { Driver } from "../data/drivers";
import Pagination from "./Pagination";
import ActionMenu from "./ActionMenu";
import DriverDetailsModal from "./DriverDetailsModal";

interface DriversTableProps {
  drivers: Driver[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const DriversTable = ({
  drivers,
  currentPage,
  totalPages,
  onPageChange,
}: DriversTableProps) => {
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Active":
        return "status-badge--active";
      case "Inactive":
        return "status-badge--inactive";
      case "Suspended":
        return "status-badge--suspended";
      default:
        return "";
    }
  };

  const handleViewDetails = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedDriver(null);
    }, 300); // Wait for animation to complete
  };

  const handleDelete = (driverId: string) => {
    console.log("Delete driver:", driverId);
    // TODO: Implement delete logic with confirmation
  };

  const handleBlock = (driverId: string) => {
    console.log("Block driver:", driverId);
    // TODO: Implement block logic
  };

  const renderStars = (rating: number, reviewsCount: number) => {
    return (
      <div className="rating-display">
        <span className="rating-display__star">★</span>
        <span className="rating-display__value">{rating.toFixed(1)}</span>
        <span className="rating-display__reviews">
          ({reviewsCount} reviews)
        </span>
      </div>
    );
  };

  return (
    <>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Rating</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map((driver) => (
              <tr key={driver.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-cell__avatar">
                      {driver.fullname.charAt(0)}
                    </div>
                    <span className="user-cell__name">{driver.fullname}</span>
                  </div>
                </td>
                <td>{driver.email}</td>
                <td>{driver.phone}</td>
                <td>
                  <span className="vehicle-info">
                    <span className="vehicle-info__type">
                      {driver.vehicleType}
                    </span>
                    <span className="vehicle-info__name">
                      ({driver.vehicleName})
                    </span>
                  </span>
                </td>
                <td>{renderStars(driver.rating, driver.reviewsCount)}</td>
                <td>
                  <span
                    className={`status-badge ${getStatusClass(driver.status)}`}
                  >
                    {driver.status}
                  </span>
                </td>
                <td>
                  <ActionMenu
                    userId={driver.id}
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    onBlock={handleBlock}
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

      <DriverDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        driver={selectedDriver}
      />
    </>
  );
};

export default DriversTable;
