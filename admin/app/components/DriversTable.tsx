"use client";

import { useState } from "react";
import { Driver } from "../data/drivers";
import Pagination from "./Pagination";
import ActionMenu from "./ActionMenu";
import DriverDetailsModal from "./DriverDetailsModal";
import EditDriverModal from "./EditDriverModal";
import ConfirmModal from "./ConfirmModal";
import { useDriverContext } from "../context/DriverContext";
import { useAlert } from "../context/AlertContext";

interface DriversTableProps {
  drivers: Driver[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh?: () => void;
}

const DriversTable = ({
  drivers,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh,
}: DriversTableProps) => {
  const { fetchDriverDetails, editDriver, deleteDriver, blockDriver } =
    useDriverContext();
  const { showAlert } = useAlert();
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const getStatusClass = (status: string) => {
    switch (status) {
      case "Online":
        return "status-badge--active";
      case "Offline":
        return "status-badge--inactive";
      case "Suspended":
        return "status-badge--suspended";
      default:
        return "";
    }
  };

  const handleViewDetails = async (driverId: string) => {
    try {
      await fetchDriverDetails(driverId);
      const driver = drivers.find((d) => d.id === driverId);
      if (driver) {
        setSelectedDriver(driver);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch driver details:", error);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setSelectedDriver(null);
    }, 300); // Wait for animation to complete
  };

  const handleEdit = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    if (driver) {
      setEditingDriver(driver);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setEditingDriver(null);
    }, 300); // Wait for animation to complete
  };

  const handleSaveDriver = (updatedDriver: Driver) => {
    console.log("Save driver:", updatedDriver);
    // TODO: Implement save logic (update local state or call API)
    handleCloseEditModal();
  };

  const handleDelete = (driverId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Driver",
      message:
        "Are you sure you want to delete this driver? This action cannot be undone.",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteDriver(driverId);
          setConfirmModal({ ...confirmModal, isOpen: false });
          // Refresh the table data
          if (onRefresh) {
            onRefresh();
          }
        } catch (error) {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const handleBlock = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId);
    const isBlocked = driver?.status === "Suspended";
    const action = isBlocked ? "unblock" : "block";

    setConfirmModal({
      isOpen: true,
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Driver`,
      message: `Are you sure you want to ${action} this driver?`,
      variant: isBlocked ? "info" : "warning",
      onConfirm: async () => {
        try {
          await blockDriver(driverId, !isBlocked);
          setConfirmModal({ ...confirmModal, isOpen: false });
          // Refresh the table data
          if (onRefresh) {
            onRefresh();
          }
        } catch (error) {
          setConfirmModal({ ...confirmModal, isOpen: false });
        }
      },
    });
  };

  const renderStars = (rating: number, reviewsCount: number) => {
    return (
      <div className="rating-display">
        <span className="rating-display__star">★</span>
        <span className="rating-display__value">{rating.toFixed(1)}</span>
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
                    userStatus={driver.status}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
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

      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        driver={editingDriver}
        onSave={handleSaveDriver}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
};

export default DriversTable;
