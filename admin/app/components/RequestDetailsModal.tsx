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
import { useDriverContext } from "../context/DriverContext";

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
  const { currentDriver, fetchDriverDetails } = useDriverContext();
  const [showVehicleImages, setShowVehicleImages] = useState(false);
  const [showLicenseImages, setShowLicenseImages] = useState(false);

  useEffect(() => {
    // Fetch full driver details when request is selected
    if (request && isOpen) {
      fetchDriverDetails(request.id);
    }
  }, [request, isOpen]);

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
    }
  };

  const handleDecline = () => {
    if (request && onDecline) {
      onDecline(request.id);
    }
  };

  // Use currentDriver from context if available, otherwise fallback to request prop
  const driver = currentDriver || null;
  const displayData = request; // Use request for display until driver details load

  if (!displayData) return null;

  // Try to get profile image from driver context if available, else fallback to request prop

  const profileImg = (request as any).profileImg;
  // Compute initials from name
  let initials = "";
  if (displayData && displayData.fullname) {
    const names = displayData.fullname.trim().split(" ");
    initials =
      names.length === 1
        ? names[0][0]
        : names[0][0] + names[names.length - 1][0];
    initials = initials.toUpperCase();
  }

  return (
    <>
      {isOpen && (
        <div
          className="user-details-modal__backdrop"
          onClick={onClose}
          role="button"
          aria-label="Close modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            zIndex: 10001,
          }}
        ></div>
      )}

      <div
        className={`user-details-modal ${
          isOpen ? "user-details-modal--open" : ""
        }`}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: isOpen ? "translate(-50%, -50%)" : undefined,
          zIndex: 11000, // higher than ConfirmModal
          maxWidth: 600,
          width: "95%",
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div
          className="user-details-modal__header"
          style={{ display: "flex", alignItems: "center", gap: 16 }}
        >
          {profileImg ? (
            <img
              src={profileImg}
              alt="Profile"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #eee",
                marginRight: 12,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#e5e7eb",
                color: "#374151",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 22,
                marginRight: 12,
                border: "2px solid #eee",
                userSelect: "none",
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <h2 className="user-details-modal__name">{displayData.fullname}</h2>
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
                    {displayData.email}
                  </span>
                </div>
              </div>

              <div className="user-details-modal__info-item">
                <MdPhone className="user-details-modal__info-icon" />
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">Phone</span>
                  <span className="user-details-modal__info-value">
                    {displayData.phone}
                  </span>
                </div>
              </div>

              {displayData.dateOfBirth && (
                <div className="user-details-modal__info-item">
                  <MdCalendarToday className="user-details-modal__info-icon" />
                  <div className="user-details-modal__info-content">
                    <span className="user-details-modal__info-label">
                      Date of Birth
                    </span>
                    <span className="user-details-modal__info-value">
                      {new Date(displayData.dateOfBirth).toLocaleDateString()}
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
                    {displayData.vehicleType}
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
                    {displayData.vehicleName}
                  </span>
                </div>
              </div>

              {displayData.vehicleDetails && (
                <>
                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Brand & Model
                      </span>
                      <span className="user-details-modal__info-value">
                        {displayData.vehicleDetails.brand}{" "}
                        {displayData.vehicleDetails.model}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Color
                      </span>
                      <span className="user-details-modal__info-value">
                        {displayData.vehicleDetails.color}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Year
                      </span>
                      <span className="user-details-modal__info-value">
                        {displayData.vehicleDetails.year}
                      </span>
                    </div>
                  </div>

                  <div className="user-details-modal__info-item">
                    <div className="user-details-modal__info-content">
                      <span className="user-details-modal__info-label">
                        Plate Number
                      </span>
                      <span className="user-details-modal__info-value">
                        {displayData.vehicleDetails.plateNumber}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Vehicle Images */}
            {displayData.vehicleDetails?.exteriorImage &&
              displayData.vehicleDetails?.interiorImage && (
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
                              src={displayData.vehicleDetails.exteriorImage}
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
                              src={displayData.vehicleDetails.interiorImage}
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
          {displayData.driverLicence && (
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
                      {displayData.driverLicence.number}
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
                        displayData.driverLicence.expiryDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* License Images */}
              {displayData.driverLicence.frontImage &&
                displayData.driverLicence.backImage &&
                displayData.driverLicence.selfieWithLicence && (
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
                                src={displayData.driverLicence.frontImage}
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
                                src={displayData.driverLicence.backImage}
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
                                src={
                                  displayData.driverLicence.selfieWithLicence
                                }
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
                    {displayData.id}
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
                    {new Date(displayData.requestDate).toLocaleDateString()}
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
