"use client";

import { useEffect, useState } from "react";
import { IoClose, IoChevronDown, IoChevronUp } from "react-icons/io5";
import {
  MdEmail,
  MdPhone,
  MdDirectionsCar,
  MdCalendarToday,
  MdCardTravel,
  MdImage,
} from "react-icons/md";
import { DriverRequest } from "../data/requests";

interface RequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: DriverRequest | null;
  onApprove?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
}

const RequestDetailsModal = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onDecline,
}: RequestDetailsModalProps) => {
  const [showVehicleImages, setShowVehicleImages] = useState(false);
  const [showLicenseImages, setShowLicenseImages] = useState(false);

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

  const handleApprove = () => {
    if (request && onApprove) {
      onApprove(request.id);
      onClose();
    }
  };

  const handleDecline = () => {
    if (request && onDecline) {
      onDecline(request.id);
      onClose();
    }
  };

  if (!request) return null;

  return (
    <>
      {isOpen && (
        <div
          className="user-details-modal__backdrop"
          onClick={onClose}
          role="button"
          aria-label="Close modal"
        />
      )}

      <div
        className={`user-details-modal ${
          isOpen ? "user-details-modal--open" : ""
        }`}
      >
        {/* Header */}
        <div className="user-details-modal__header">
          <div>
            <h2 className="user-details-modal__name">{request.fullname}</h2>
            <span className="user-details-modal__subtitle">
              Driver Application
            </span>
          </div>
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
          {/* Contact Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Contact Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <MdEmail className="user-details-modal__info-icon" />
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Email</span>
                  <span className="user-details-modal__info-value">
                    {request.email}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <MdPhone className="user-details-modal__info-icon" />
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Phone</span>
                  <span className="user-details-modal__info-value">
                    {request.phone}
                  </span>
                </div>
              </div>

              {request.dateOfBirth && (
                <div className="user-details-modal__info-item">
                  <MdCalendarToday className="user-details-modal__info-icon" />
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Date of Birth
                    </span>
                    <span className="user-details-modal__info-value">
                      {new Date(request.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Vehicle Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <MdDirectionsCar className="user-details-modal__info-icon" />
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Vehicle Type
                  </span>
                  <span className="user-details-modal__info-value">
                    {request.vehicleType}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <MdDirectionsCar className="user-details-modal__info-icon" />
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Vehicle Name
                  </span>
                  <span className="user-details-modal__info-value">
                    {request.vehicleName}
                  </span>
                </div>
              </div>

              {request.vehicleDetails && (
                <>
                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Brand & Model
                      </span>
                      <span className="user-details-modal__info-value">
                        {request.vehicleDetails.brand}{" "}
                        {request.vehicleDetails.model}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Color
                      </span>
                      <span className="user-details-modal__info-value">
                        {request.vehicleDetails.color}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Year
                      </span>
                      <span className="user-details-modal__info-value">
                        {request.vehicleDetails.year}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Plate Number
                      </span>
                      <span className="user-details-modal__info-value">
                        {request.vehicleDetails.plateNumber}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vehicle Images */}
            {request.vehicleDetails?.exteriorImage &&
              request.vehicleDetails?.interiorImage && (
                <div className="user-details-modal__expandable">
                  <button
                    className="user-details-modal__expandable-header"
                    onClick={() => setShowVehicleImages(!showVehicleImages)}
                  >
                    <div className="user-details-modal__expandable-title">
                      <MdImage className="user-details-modal__expandable-icon" />
                      <span>Vehicle Images</span>
                    </div>
                    {showVehicleImages ? <IoChevronUp /> : <IoChevronDown />}
                  </button>

                  {showVehicleImages && (
                    <div className="user-details-modal__expandable-content">
                      <div className="user-details-modal__image-grid">
                        <div className="user-details-modal__image-item">
                          <span className="user-details-modal__image-label">
                            Exterior
                          </span>
                          <div className="user-details-modal__image-wrapper">
                            <img
                              src={request.vehicleDetails.exteriorImage}
                              alt="Vehicle Exterior"
                              className="user-details-modal__image"
                            />
                          </div>
                        </div>

                        <div className="user-details-modal__image-item">
                          <span className="user-details-modal__image-label">
                            Interior
                          </span>
                          <div className="user-details-modal__image-wrapper">
                            <img
                              src={request.vehicleDetails.interiorImage}
                              alt="Vehicle Interior"
                              className="user-details-modal__image"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* License Information */}
          {request.driverLicence && (
            <div className="user-details-modal__section">
              <h4 className="user-details-modal__section-title">
                Driver License Information
              </h4>
              <div className="user-details-modal__info-grid">
                <div className="user-details-modal__info-item">
                  <MdCardTravel className="user-details-modal__info-icon" />
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      License Number
                    </span>
                    <span className="user-details-modal__info-value">
                      {request.driverLicence.number}
                    </span>
                  </div>
                </div>

                <div className="user-details-modal__info-item">
                  <MdCalendarToday className="user-details-modal__info-icon" />
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Expiry Date
                    </span>
                    <span className="user-details-modal__info-value">
                      {new Date(
                        request.driverLicence.expiryDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Images */}
              {request.driverLicence.frontImage &&
                request.driverLicence.backImage &&
                request.driverLicence.selfieWithLicence && (
                  <div className="user-details-modal__expandable">
                    <button
                      className="user-details-modal__expandable-header"
                      onClick={() => setShowLicenseImages(!showLicenseImages)}
                    >
                      <div className="user-details-modal__expandable-title">
                        <MdImage className="user-details-modal__expandable-icon" />
                        <span>License Images</span>
                      </div>
                      {showLicenseImages ? <IoChevronUp /> : <IoChevronDown />}
                    </button>

                    {showLicenseImages && (
                      <div className="user-details-modal__expandable-content">
                        <div className="user-details-modal__image-grid user-details-modal__image-grid--three">
                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              Front
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={request.driverLicence.frontImage}
                                alt="License Front"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>

                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              Back
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={request.driverLicence.backImage}
                                alt="License Back"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>

                          <div className="user-details-modal__image-item">
                            <span className="user-details-modal__image-label">
                              Selfie with License
                            </span>
                            <div className="user-details-modal__image-wrapper">
                              <img
                                src={request.driverLicence.selfieWithLicence}
                                alt="Selfie with License"
                                className="user-details-modal__image"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Additional Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Request Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Request ID
                  </span>
                  <span className="user-details-modal__info-value">
                    {request.id}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <MdCalendarToday className="user-details-modal__info-icon" />
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    Request Date
                  </span>
                  <span className="user-details-modal__info-value">
                    {new Date(request.requestDate).toLocaleDateString()}
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
            onClick={handleDecline}
          >
            Decline
          </button>
          <button
            className="user-details-modal__button user-details-modal__button--primary"
            onClick={handleApprove}
          >
            Approve Application
          </button>
        </div>
      </div>
    </>
  );
};

export default RequestDetailsModal;
