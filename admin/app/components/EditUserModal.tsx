"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { User } from "../context/UserContext";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave?: (user: User) => void;
}

const EditUserModal = ({
  isOpen,
  onClose,
  user,
  onSave,
}: EditUserModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
      });
    }
  }, [user]);

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
    if (user) {
      const updatedUser = {
        ...user,
        ...formData,
      };
      onSave?.(updatedUser);
      onClose();
    }
  };

  if (!user) return null;

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
              <h2 className="edit-modal__title">Edit User</h2>
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
                {/* Full Name */}
                <div className="edit-modal__field">
                  <label htmlFor="name" className="edit-modal__field-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="edit-modal__field-input"
                    required
                  />
                </div>

                {/* Email */}
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

                {/* Phone */}
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

                {/* User ID (Read-only) */}
                <div className="edit-modal__field">
                  <label className="edit-modal__field-label">User ID</label>
                  <input
                    type="text"
                    value={user._id}
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

export default EditUserModal;
