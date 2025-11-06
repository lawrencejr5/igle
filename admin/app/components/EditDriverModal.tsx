"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { Driver } from "../data/drivers";

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: Driver | null;
  onSave?: (driver: Driver) => void;
}

const EditDriverModal = ({
  isOpen,
  onClose,
  driver,
  onSave,
}: EditDriverModalProps) => {
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    phone: "",
    vehicleType: "Cab" as "Cab" | "Bike" | "SUV" | "Keke" | "Van" | "Truck",
    status: "Active" as "Active" | "Inactive" | "Suspended",
    dateOfBirth: "",
    vehicleBrand: "",
    vehicleModel: "",
    vehicleColor: "",
    vehicleYear: "",
    vehiclePlateNumber: "",
    licenseNumber: "",
    licenseExpiryDate: "",
  });

  useEffect(() => {
    if (driver) {
      setFormData({
        fullname: driver.fullname,
        email: driver.email,
        phone: driver.phone,
        vehicleType: driver.vehicleType,
        status: driver.status,
        dateOfBirth: driver.dateOfBirth || "",
        vehicleBrand: driver.vehicleDetails?.brand || "",
        vehicleModel: driver.vehicleDetails?.model || "",
        vehicleColor: driver.vehicleDetails?.color || "",
        vehicleYear: driver.vehicleDetails?.year || "",
        vehiclePlateNumber: driver.vehicleDetails?.plateNumber || "",
        licenseNumber: driver.driverLicence?.number || "",
        licenseExpiryDate: driver.driverLicence?.expiryDate || "",
      });
    }
  }, [driver]);

  useEffect(() => {
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (driver) {
      const updatedDriver: Driver = {
        ...driver,
        fullname: formData.fullname,
        email: formData.email,
        phone: formData.phone,
        vehicleType: formData.vehicleType,
        status: formData.status,
        dateOfBirth: formData.dateOfBirth,
        vehicleDetails: {
          ...driver.vehicleDetails,
          brand: formData.vehicleBrand,
          model: formData.vehicleModel,
          color: formData.vehicleColor,
          year: formData.vehicleYear,
          plateNumber: formData.vehiclePlateNumber,
          exteriorImage: driver.vehicleDetails?.exteriorImage,
          interiorImage: driver.vehicleDetails?.interiorImage,
        },
        driverLicence: {
          ...driver.driverLicence,
          number: formData.licenseNumber,
          expiryDate: formData.licenseExpiryDate,
          frontImage: driver.driverLicence?.frontImage,
          backImage: driver.driverLicence?.backImage,
          selfieWithLicence: driver.driverLicence?.selfieWithLicence,
        },
      };
      onSave?.(updatedDriver);
      onClose();
    }
  };

  if (!driver) return null;

  return (
    <>
      {isOpen && (
        <div className="edit-modal">
          {/* Backdrop */}
          <div className="edit-modal__backdrop" onClick={onClose} />

          {/* Modal Content */}
          <div className="edit-modal__content">
            {/* Header */}
            <div className="edit-modal__header">
              <h2 className="edit-modal__title">Edit Driver</h2>
              <button
                className="edit-modal__close"
                onClick={onClose}
                aria-label="Close modal"
              >
                <IoClose />
              </button>
            </div>

            {/* Body */}
            <div className="edit-modal__body">
              <form onSubmit={handleSubmit} className="edit-modal__form">
                {/* Personal Information Section */}
                <div className="edit-modal__section">
                  <h3 className="edit-modal__section-title">
                    Personal Information
                  </h3>

                  <div className="edit-modal__field">
                    <label
                      htmlFor="fullname"
                      className="edit-modal__field-label"
                    >
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullname"
                      name="fullname"
                      value={formData.fullname}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                      required
                    />
                  </div>

                  <div className="edit-modal__field">
                    <label htmlFor="email" className="edit-modal__field-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                      required
                    />
                  </div>

                  <div className="edit-modal__field">
                    <label htmlFor="phone" className="edit-modal__field-label">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                      required
                    />
                  </div>

                  <div className="edit-modal__field">
                    <label
                      htmlFor="dateOfBirth"
                      className="edit-modal__field-label"
                    >
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                    />
                  </div>

                  <div className="edit-modal__field">
                    <label htmlFor="status" className="edit-modal__field-label">
                      Account Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="edit-modal__field-select"
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle Information Section */}
                <div className="edit-modal__section">
                  <h3 className="edit-modal__section-title">
                    Vehicle Information
                  </h3>

                  <div className="edit-modal__field">
                    <label
                      htmlFor="vehicleType"
                      className="edit-modal__field-label"
                    >
                      Vehicle Type
                    </label>
                    <select
                      id="vehicleType"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      className="edit-modal__field-select"
                      required
                    >
                      <option value="Cab">Cab</option>
                      <option value="Bike">Bike</option>
                      <option value="SUV">SUV</option>
                      <option value="Keke">Keke</option>
                      <option value="Van">Van</option>
                      <option value="Truck">Truck</option>
                    </select>
                  </div>

                  <div className="edit-modal__field-group">
                    <div className="edit-modal__field">
                      <label
                        htmlFor="vehicleBrand"
                        className="edit-modal__field-label"
                      >
                        Brand
                      </label>
                      <input
                        type="text"
                        id="vehicleBrand"
                        name="vehicleBrand"
                        value={formData.vehicleBrand}
                        onChange={handleChange}
                        className="edit-modal__field-input"
                      />
                    </div>

                    <div className="edit-modal__field">
                      <label
                        htmlFor="vehicleModel"
                        className="edit-modal__field-label"
                      >
                        Model
                      </label>
                      <input
                        type="text"
                        id="vehicleModel"
                        name="vehicleModel"
                        value={formData.vehicleModel}
                        onChange={handleChange}
                        className="edit-modal__field-input"
                      />
                    </div>
                  </div>

                  <div className="edit-modal__field-group">
                    <div className="edit-modal__field">
                      <label
                        htmlFor="vehicleColor"
                        className="edit-modal__field-label"
                      >
                        Color
                      </label>
                      <input
                        type="text"
                        id="vehicleColor"
                        name="vehicleColor"
                        value={formData.vehicleColor}
                        onChange={handleChange}
                        className="edit-modal__field-input"
                      />
                    </div>

                    <div className="edit-modal__field">
                      <label
                        htmlFor="vehicleYear"
                        className="edit-modal__field-label"
                      >
                        Year
                      </label>
                      <input
                        type="text"
                        id="vehicleYear"
                        name="vehicleYear"
                        value={formData.vehicleYear}
                        onChange={handleChange}
                        className="edit-modal__field-input"
                      />
                    </div>
                  </div>

                  <div className="edit-modal__field">
                    <label
                      htmlFor="vehiclePlateNumber"
                      className="edit-modal__field-label"
                    >
                      Plate Number
                    </label>
                    <input
                      type="text"
                      id="vehiclePlateNumber"
                      name="vehiclePlateNumber"
                      value={formData.vehiclePlateNumber}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                    />
                  </div>
                </div>

                {/* License Information Section */}
                <div className="edit-modal__section">
                  <h3 className="edit-modal__section-title">
                    License Information
                  </h3>

                  <div className="edit-modal__field">
                    <label
                      htmlFor="licenseNumber"
                      className="edit-modal__field-label"
                    >
                      License Number
                    </label>
                    <input
                      type="text"
                      id="licenseNumber"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                    />
                  </div>

                  <div className="edit-modal__field">
                    <label
                      htmlFor="licenseExpiryDate"
                      className="edit-modal__field-label"
                    >
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      id="licenseExpiryDate"
                      name="licenseExpiryDate"
                      value={formData.licenseExpiryDate}
                      onChange={handleChange}
                      className="edit-modal__field-input"
                    />
                  </div>
                </div>

                {/* Driver ID (Read-only) */}
                <div className="edit-modal__field">
                  <label className="edit-modal__field-label">Driver ID</label>
                  <input
                    type="text"
                    value={driver.id}
                    className="edit-modal__field-input"
                    disabled
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="edit-modal__footer">
              <button
                type="button"
                className="edit-modal__button edit-modal__button--cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="edit-modal__button edit-modal__button--save"
                onClick={handleSubmit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditDriverModal;
