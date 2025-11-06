"use client";

import { useEffect, useState } from "react";
import { IoClose, IoChevronDown, IoChevronUp } from "react-icons/io5";
import {
  MdEmail,
  MdPhone,
  MdDirectionsCar,
  MdStar,
  MdCalendarToday,
  MdLocationOn,
  MdCardTravel,
  MdImage,
} from "react-icons/md";
import { Driver } from "../data/drivers";
import EditDriverModal from "./EditDriverModal";

interface DriverDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
}

const DriverDetailsModal = ({
  isOpen,
  onClose,
  driver,
}: DriverDetailsModalProps) => {
  const [showVehicleImages, setShowVehicleImages] = useState(false);
  const [showLicenseImages, setShowLicenseImages] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleEditClick = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleSaveDriver = (updatedDriver: Driver) => {
    console.log("Save driver from details modal:", updatedDriver);
    // TODO: Implement save logic
    setIsEditModalOpen(false);
  };

  if (!driver) return null;

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
          <h2 className="user-details-modal__title">Driver Details</h2>
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
          {/* Driver Profile Section */}
          <div className="user-details-modal__profile">
            <div className="user-details-modal__avatar">
              {driver.fullname.charAt(0)}
            </div>
            <div className="user-details-modal__profile-info">
              <h3 className="user-details-modal__name">{driver.fullname}</h3>
              <span className={`status-badge ${getStatusClass(driver.status)}`}>
                {driver.status}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Contact Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdEmail />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Email</span>
                  <span className="user-details-modal__info-value">
                    {driver.email}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdPhone />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Phone</span>
                  <span className="user-details-modal__info-value">
                    {driver.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle & Rating Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Driver Statistics
            </h4>
            <div className="user-details-modal__stats-grid user-details-modal__stats-grid--three">
              <div className="user-details-modal__stat-card user-details-modal__stat-card--vertical">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rating user-details-modal__stat-icon--colored">
                  <MdStar />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {driver.rating.toFixed(1)}
                  </span>
                  <span className="user-details-modal__stat-label">Rating</span>
                  <span className="user-details-modal__stat-sublabel">
                    {driver.reviewsCount} reviews
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card user-details-modal__stat-card--vertical">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides user-details-modal__stat-icon--colored">
                  <MdCardTravel />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {driver.totalTrips || 0}
                  </span>
                  <span className="user-details-modal__stat-label">
                    Total Trips
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card user-details-modal__stat-card--vertical">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--status user-details-modal__stat-icon--colored">
                  <MdLocationOn />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value">
                    {driver.isOnline ? "Online" : "Offline"}
                  </span>
                  <span className="user-details-modal__stat-label">Status</span>
                  <span className="user-details-modal__stat-sublabel">
                    {driver.isAvailable ? "Available" : "Busy"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Vehicle Information
            </h4>
            <div className="user-details-modal__info-grid user-details-modal__info-grid--two">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-icon">
                  <MdDirectionsCar />
                </div>
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Vehicle Type
                  </span>
                  <span className="user-details-modal__info-value">
                    {driver.vehicleType}
                  </span>
                </div>
              </div>

              {driver.vehicleDetails && (
                <>
                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Brand & Model
                      </span>
                      <span className="user-details-modal__info-value">
                        {driver.vehicleDetails.brand}{" "}
                        {driver.vehicleDetails.model}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Color
                      </span>
                      <span className="user-details-modal__info-value">
                        {driver.vehicleDetails.color}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Year
                      </span>
                      <span className="user-details-modal__info-value">
                        {driver.vehicleDetails.year}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Plate Number
                      </span>
                      <span className="user-details-modal__info-value">
                        {driver.vehicleDetails.plateNumber}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vehicle Images - Expandable */}
            {driver.vehicleDetails &&
              (driver.vehicleDetails.exteriorImage ||
                driver.vehicleDetails.interiorImage) && (
                <div className="user-details-modal__expandable">
                  <button
                    className="user-details-modal__expandable-trigger"
                    onClick={() => setShowVehicleImages(!showVehicleImages)}
                  >
                    <div className="user-details-modal__expandable-trigger-content">
                      <MdImage />
                      <span>View Vehicle Images</span>
                    </div>
                    {showVehicleImages ? <IoChevronUp /> : <IoChevronDown />}
                  </button>

                  {showVehicleImages && (
                    <div className="user-details-modal__expandable-content">
                      <div className="user-details-modal__images-grid">
                        {driver.vehicleDetails.exteriorImage && (
                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              Exterior View
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={driver.vehicleDetails.exteriorImage}
                                alt="Vehicle Exterior"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>
                        )}
                        {driver.vehicleDetails.interiorImage && (
                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              Interior View
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={driver.vehicleDetails.interiorImage}
                                alt="Vehicle Interior"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Driver License Information */}
          {driver.driverLicence && (
            <div className="user-details-modal__section">
              <h4 className="user-details-modal__section-title">
                License Information
              </h4>
              <div className="user-details-modal__info-grid user-details-modal__info-grid--two">
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      License Number
                    </span>
                    <span className="user-details-modal__info-value">
                      {driver.driverLicence.number}
                    </span>
                  </div>
                </div>

                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdCalendarToday />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Expiry Date
                    </span>
                    <span className="user-details-modal__info-value">
                      {new Date(
                        driver.driverLicence.expiryDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Images - Expandable */}
              {(driver.driverLicence.frontImage ||
                driver.driverLicence.backImage ||
                driver.driverLicence.selfieWithLicence) && (
                <div className="user-details-modal__expandable">
                  <button
                    className="user-details-modal__expandable-trigger"
                    onClick={() => setShowLicenseImages(!showLicenseImages)}
                  >
                    <div className="user-details-modal__expandable-trigger-content">
                      <MdImage />
                      <span>View License Images</span>
                    </div>
                    {showLicenseImages ? <IoChevronUp /> : <IoChevronDown />}
                  </button>

                  {showLicenseImages && (
                    <div className="user-details-modal__expandable-content">
                      <div className="user-details-modal__images-grid">
                        {driver.driverLicence.frontImage && (
                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              License Front
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={driver.driverLicence.frontImage}
                                alt="License Front"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>
                        )}
                        {driver.driverLicence.backImage && (
                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              License Back
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={driver.driverLicence.backImage}
                                alt="License Back"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>
                        )}
                        {driver.driverLicence.selfieWithLicence && (
                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              Selfie with License
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={driver.driverLicence.selfieWithLicence}
                                alt="Selfie with License"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Personal Information */}
          {driver.dateOfBirth && (
            <div className="user-details-modal__section">
              <h4 className="user-details-modal__section-title">
                Personal Information
              </h4>
              <div className="user-details-modal__info-grid user-details-modal__info-grid--two">
                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-icon">
                    <MdCalendarToday />
                  </div>
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Date of Birth
                    </span>
                    <span className="user-details-modal__info-value">
                      {new Date(driver.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="user-details-modal__info-item">
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Driver ID
                    </span>
                    <span className="user-details-modal__info-value">
                      {driver.id}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Additional Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Driver ID
                  </span>
                  <span className="user-details-modal__info-value">
                    {driver.id}
                  </span>
                </div>
              </div>
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
          <button
            className="user-details-modal__button user-details-modal__button--primary"
            onClick={handleEditClick}
          >
            Edit Driver
          </button>
        </div>
      </div>

      <EditDriverModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        driver={driver}
        onSave={handleSaveDriver}
      />
    </>
  );
};

export default DriverDetailsModal;
