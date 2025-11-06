"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoCloseCircleOutline,
  IoPersonAddOutline,
  IoCashOutline,
} from "react-icons/io5";

interface DeliveryActionsMenuProps {
  deliveryId: string;
  deliveryStatus: string;
  onViewDetails?: (deliveryId: string) => void;
  onCancel?: (deliveryId: string) => void;
  onAssignDriver?: (deliveryId: string) => void;
  onRefund?: (deliveryId: string) => void;
}

const DeliveryActionsMenu = ({
  deliveryId,
  deliveryStatus,
  onViewDetails,
  onCancel,
  onAssignDriver,
  onRefund,
}: DeliveryActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const dropdownHeight = 200; // Approximate height of dropdown
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If not enough space below and more space above, open upward
      if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // Determine which actions to show based on delivery status
  const canCancel = ["pending", "scheduled", "accepted", "arrived"].includes(
    deliveryStatus
  );
  const canAssignDriver = ["pending"].includes(deliveryStatus);
  const canRefund = ["cancelled", "delivered", "failed"].includes(
    deliveryStatus
  );

  return (
    <div className="action-menu" ref={menuRef}>
      <button
        className="action-menu__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="More actions"
      >
        <FiMoreVertical />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`action-menu__dropdown ${
            openUpward ? "action-menu__dropdown--upward" : ""
          }`}
        >
          <button
            className="action-menu__item"
            onClick={() => handleAction(() => onViewDetails?.(deliveryId))}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>

          {canAssignDriver && (
            <button
              className="action-menu__item"
              onClick={() => handleAction(() => onAssignDriver?.(deliveryId))}
            >
              <IoPersonAddOutline />
              <span>Assign Driver</span>
            </button>
          )}

          {canCancel && (
            <button
              className="action-menu__item action-menu__item--danger"
              onClick={() => handleAction(() => onCancel?.(deliveryId))}
            >
              <IoCloseCircleOutline />
              <span>Cancel Delivery</span>
            </button>
          )}

          {canRefund && (
            <button
              className="action-menu__item action-menu__item--warning"
              onClick={() => handleAction(() => onRefund?.(deliveryId))}
            >
              <IoCashOutline />
              <span>Process Refund</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryActionsMenu;
