"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import {
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdDirectionsCar,
  MdLocalShipping,
} from "react-icons/md";
import { User } from "../context/UserContext";
import EditUserModal from "./EditUserModal";

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserDetailsModal = ({ isOpen, onClose, user }: UserDetailsModalProps) => {
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

  const handleSaveUser = (updatedUser: User) => {
    console.log("Save user from details modal:", updatedUser);
    // TODO: Implement save logic
    setIsEditModalOpen(false);
  };

  if (!user) return null;

  // Optionally, you can use is_blocked or is_verified for status
  const getStatusClass = (user: User) => {
    if (user.is_blocked) return "status-badge--suspended";
    if (user.is_verified) return "status-badge--active";
    return "status-badge--inactive";
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
          <h2 className="user-details-modal__title">User Details</h2>
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
          {/* User Profile Section */}
          <div className="user-details-modal__profile">
            <div className="user-details-modal__avatar">
              {user.name.charAt(0)}
            </div>
            <div className="user-details-modal__profile-info">
              <h3 className="user-details-modal__name">{user.name}</h3>
              <span className={`status-badge ${getStatusClass(user)}`}>
                {user.is_blocked
                  ? "Suspended"
                  : user.is_verified
                  ? "Active"
                  : "Inactive"}
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
                    {user.email}
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
                    {user.phone}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Statistics */}

          {/* Additional Information */}
          <div className="user-details-modal__section">
            <h4 className="user-details-modal__section-title">
              Additional Information
            </h4>
            <div className="user-details-modal__info-grid">
              <div className="user-details-modal__info-item">
                <div className="user-details-modal__info-content">
                  <span className="user-details-modal__info-label">
                    User ID
                  </span>
                  <span className="user-details-modal__info-value">
                    {user._id}
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
            Edit User
          </button>
        </div>
      </div>

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        user={user}
        onSave={handleSaveUser}
      />
    </>
  );
};

export default UserDetailsModal;
