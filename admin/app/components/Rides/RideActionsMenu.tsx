"use client";

import { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import {
  IoEyeOutline,
  IoCloseCircleOutline,
  IoPersonAddOutline,
  IoCashOutline,
} from "react-icons/io5";

interface RideActionsMenuProps {
  rideId: string;
  rideStatus: string;
  onViewDetails?: (rideId: string) => void;
  onCancel?: (rideId: string) => void;
  onAssignDriver?: (rideId: string) => void;
  onRefund?: (rideId: string) => void;
}

const RideActionsMenu = ({
  rideId,
  rideStatus,
  onViewDetails,
  onCancel,
  onAssignDriver,
  onRefund,
}: RideActionsMenuProps) => {
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

  // Determine which actions to show based on ride status
  const canCancel = ["pending", "scheduled", "accepted"].includes(rideStatus);
  const canAssignDriver = ["pending"].includes(rideStatus);
  const canRefund = ["cancelled", "completed"].includes(rideStatus);

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
            onClick={() => handleAction(() => onViewDetails?.(rideId))}
          >
            <IoEyeOutline />
            <span>View Details</span>
          </button>

          {canAssignDriver && (
            <button
              className="action-menu__item"
              onClick={() => handleAction(() => onAssignDriver?.(rideId))}
            >
              <IoPersonAddOutline />
              <span>Assign Driver</span>
            </button>
          )}

          {canCancel && (
            <button
              className="action-menu__item action-menu__item--danger"
              onClick={() => handleAction(() => onCancel?.(rideId))}
            >
              <IoCloseCircleOutline />
              <span>Cancel Ride</span>
            </button>
          )}

          {canRefund && (
            <button
              className="action-menu__item action-menu__item--warning"
              onClick={() => handleAction(() => onRefund?.(rideId))}
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

export default RideActionsMenu;
