"use client";

import { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { MdEmail, MdPhone, MdDirectionsCar, MdStar } from "react-icons/md";
import { Driver } from "../data/drivers";

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

  const renderStars = (rating: number, reviewsCount: number) => {
    return (
      <div className="rating-display rating-display--large">
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
              Driver Information
            </h4>
            <div className="user-details-modal__stats-grid">
              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rides">
                  <MdDirectionsCar />
                </div>
                <div className="user-details-modal__stat-content">
                  <span className="user-details-modal__stat-value user-details-modal__stat-value--small">
                    <span className="vehicle-info">
                      <span className="vehicle-info__type">
                        {driver.vehicleType}
                      </span>
                      <span className="vehicle-info__name">
                        ({driver.vehicleName})
                      </span>
                    </span>
                  </span>
                  <span className="user-details-modal__stat-label">
                    Vehicle
                  </span>
                </div>
              </div>

              <div className="user-details-modal__stat-card">
                <div className="user-details-modal__stat-icon user-details-modal__stat-icon--rating">
                  <MdStar />
                </div>
                <div className="user-details-modal__stat-content">
                  {renderStars(driver.rating, driver.reviewsCount)}
                  <span className="user-details-modal__stat-label">
                    Driver Rating
                  </span>
                </div>
              </div>
            </div>
          </div>

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
          <button className="user-details-modal__button user-details-modal__button--primary">
            Edit Driver
          </button>
        </div>
      </div>
    </>
  );
};

export default DriverDetailsModal;
